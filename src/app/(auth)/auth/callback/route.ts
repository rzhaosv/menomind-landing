import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email/resend'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Default to dashboard — middleware will auto-redirect to onboarding if needed
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const isNewUser = user.created_at &&
          (Date.now() - new Date(user.created_at).getTime()) < 60_000

        // Link Stripe customer if user paid before signing up (anonymous quiz flow)
        if (user.email) {
          linkStripeCustomer(user.id, user.email).catch((err) =>
            console.error('Failed to link Stripe customer:', err)
          )
        }

        if (isNewUser) {
          const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there'
          sendWelcomeEmail(user.email!, name).catch((err) =>
            console.error('Failed to send welcome email:', err)
          )
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}

/**
 * Check if this user's email has an existing Stripe customer with an active subscription.
 * If so, link the Stripe customer ID and upgrade to premium.
 * This handles the flow: quiz → pay → sign up (user pays before account exists).
 */
async function linkStripeCustomer(userId: string, email: string) {
  const { getStripe } = await import('@/lib/stripe/client')
  const stripe = getStripe()

  const customers = await stripe.customers.list({ email, limit: 1 })
  if (customers.data.length === 0) return

  const customer = customers.data[0]

  // Check if customer has an active subscription
  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status: 'active',
    limit: 1,
  })

  // Also check trialing
  if (subscriptions.data.length === 0) {
    const trialingSubs = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'trialing',
      limit: 1,
    })
    if (trialingSubs.data.length === 0) return
  }

  // User has an active/trialing subscription — upgrade them
  const adminSupabase = createAdminClient()
  await adminSupabase
    .from('users')
    .update({
      subscription_tier: 'premium',
      stripe_customer_id: customer.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  console.log(`linkStripeCustomer: Linked user ${userId} to Stripe customer ${customer.id}, upgraded to premium`)
}
