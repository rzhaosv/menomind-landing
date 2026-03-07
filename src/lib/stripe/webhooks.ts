import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.userId
  if (!userId) return

  const supabase = createAdminClient()

  // Update user subscription tier
  await supabase
    .from('users')
    .update({
      subscription_tier: 'premium',
      stripe_customer_id: session.customer as string,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  // Log subscription event
  await supabase.from('subscription_events').insert({
    user_id: userId,
    event_type: 'checkout.session.completed',
    stripe_event_id: session.id,
    data: {
      customer: session.customer,
      subscription: session.subscription,
      amount_total: session.amount_total,
    },
  })
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata?.userId
  if (!userId) return

  const supabase = createAdminClient()
  const isActive = ['active', 'trialing'].includes(subscription.status)

  await supabase
    .from('users')
    .update({
      subscription_tier: isActive ? 'premium' : 'free',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

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
}

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata?.userId
  if (!userId) return

  const supabase = createAdminClient()

  await supabase
    .from('users')
    .update({
      subscription_tier: 'free',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  await supabase.from('subscription_events').insert({
    user_id: userId,
    event_type: 'customer.subscription.deleted',
    stripe_event_id: subscription.id,
    data: { status: subscription.status },
  })
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
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!user) return

  await supabase.from('subscription_events').insert({
    user_id: user.id,
    event_type: 'invoice.payment_failed',
    stripe_event_id: invoice.id,
    data: {
      amount_due: invoice.amount_due,
      attempt_count: invoice.attempt_count,
    },
  })
}
