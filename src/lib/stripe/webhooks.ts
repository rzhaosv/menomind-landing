import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPurchaseEvent } from '@/lib/meta/conversions-api'

// Grace period before downgrade on payment failure (3 days in ms)
const GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000

/**
 * Resolve the Supabase user ID from Stripe event metadata or customer ID.
 * Falls back to looking up by stripe_customer_id if metadata is missing.
 */
async function resolveUserId(
  metadataUserId: string | undefined,
  stripeCustomerId: string | null | undefined
): Promise<string | null> {
  if (metadataUserId) return metadataUserId

  if (!stripeCustomerId) return null

  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', stripeCustomerId)
    .single()

  return user?.id || null
}

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
) {
  const customerId = session.customer as string
  const userId = await resolveUserId(session.metadata?.userId, customerId)

  if (!userId) {
    console.error('handleCheckoutCompleted: Could not resolve userId', {
      sessionId: session.id,
      metadata: session.metadata,
      customer: customerId,
    })
    return
  }

  const supabase = createAdminClient()

  // Update user subscription tier
  const { error: updateError } = await supabase
    .from('users')
    .update({
      subscription_tier: 'premium',
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (updateError) {
    console.error('handleCheckoutCompleted: Failed to update user', updateError)
  }

  // Log subscription event
  const { error: eventError } = await supabase.from('subscription_events').insert({
    user_id: userId,
    event_type: 'checkout.session.completed',
    stripe_event_id: session.id,
    data: {
      customer: customerId,
      subscription: session.subscription,
      amount_total: session.amount_total,
    },
  })

  if (eventError) {
    console.error('handleCheckoutCompleted: Failed to log event', eventError)
  }

  // Send server-side Purchase event to Meta Conversions API
  const amountInDollars = (session.amount_total || 0) / 100
  const customerEmail = session.customer_details?.email || session.metadata?.email
  await sendPurchaseEvent({
    email: customerEmail || undefined,
    value: amountInDollars,
    currency: session.currency?.toUpperCase() || 'USD',
    eventId: session.id,
  })

  // Send welcome email
  try {
    const { sendWelcomeEmail } = await import('@/lib/email/retention-sequences')
    const email = session.customer_details?.email || session.metadata?.email
    if (email) await sendWelcomeEmail(email)
  } catch (error) {
    console.error('handleCheckoutCompleted: Failed to send welcome email', error)
  }

  console.log(`handleCheckoutCompleted: User ${userId} upgraded to premium`)
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string
  const userId = await resolveUserId(subscription.metadata?.userId, customerId)

  if (!userId) {
    console.error('handleSubscriptionUpdated: Could not resolve userId', {
      subscriptionId: subscription.id,
      customer: customerId,
    })
    return
  }

  const supabase = createAdminClient()
  const isActive = ['active', 'trialing'].includes(subscription.status)

  // For past_due status, apply grace period — don't downgrade immediately
  if (subscription.status === 'past_due') {
    console.log(
      `handleSubscriptionUpdated: User ${userId} is past_due — grace period active, keeping premium`
    )

    await supabase.from('subscription_events').insert({
      user_id: userId,
      event_type: 'customer.subscription.updated',
      stripe_event_id: subscription.id,
      data: {
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        grace_period: true,
      },
    })

    return // Keep premium during grace period
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({
      subscription_tier: isActive ? 'premium' : 'free',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (updateError) {
    console.error('handleSubscriptionUpdated: Failed to update user', updateError)
  }

  await supabase.from('subscription_events').insert({
    user_id: userId,
    event_type: 'customer.subscription.updated',
    stripe_event_id: subscription.id,
    data: {
      status: subscription.status,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
  })

  console.log(`handleSubscriptionUpdated: User ${userId} status=${subscription.status} tier=${isActive ? 'premium' : 'free'}`)
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string
  const userId = await resolveUserId(subscription.metadata?.userId, customerId)

  if (!userId) {
    console.error('handleSubscriptionDeleted: Could not resolve userId', {
      subscriptionId: subscription.id,
      customer: customerId,
    })
    return
  }

  const supabase = createAdminClient()

  const { error: updateError } = await supabase
    .from('users')
    .update({
      subscription_tier: 'free',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (updateError) {
    console.error('handleSubscriptionDeleted: Failed to update user', updateError)
  }

  await supabase.from('subscription_events').insert({
    user_id: userId,
    event_type: 'customer.subscription.deleted',
    stripe_event_id: subscription.id,
    data: { status: subscription.status },
  })

  console.log(`handleSubscriptionDeleted: User ${userId} reverted to free`)
}

export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string
  if (!customerId) return

  const supabase = createAdminClient()

  // Find user by Stripe customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id, email, full_name')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!user) {
    console.error('handleInvoicePaymentFailed: No user found for customer', customerId)
    return
  }

  await supabase.from('subscription_events').insert({
    user_id: user.id,
    event_type: 'invoice.payment_failed',
    stripe_event_id: invoice.id,
    data: {
      amount_due: invoice.amount_due,
      attempt_count: invoice.attempt_count,
      grace_period_ends: new Date(Date.now() + GRACE_PERIOD_MS).toISOString(),
    },
  })

  // Send payment failure recovery email
  try {
    const { sendPaymentFailedEmail } = await import('@/lib/email/retention-sequences')
    await sendPaymentFailedEmail(
      user.email,
      user.full_name || 'there'
    )
  } catch (error) {
    console.error('handleInvoicePaymentFailed: Failed to send recovery email', error)
  }

  console.log(`handleInvoicePaymentFailed: User ${user.id} payment failed (attempt ${invoice.attempt_count})`)
}
