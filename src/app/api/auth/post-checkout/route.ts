import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe/client'

/**
 * POST /api/auth/post-checkout
 *
 * Called by the success page after Stripe checkout. Looks up the
 * checkout session, finds/creates the user, and generates a magic
 * link so they're auto-signed in with the email they paid with.
 */
export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
    }

    // Look up the Stripe checkout session to get the email
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const email = session.customer_details?.email

    if (!email) {
      return NextResponse.json({ error: 'No email found in checkout session' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Ensure user exists (webhook should have created them, but race condition possible)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, subscription_tier')
      .eq('email', email)
      .single()

    if (!existingUser) {
      // Webhook hasn't fired yet — create the user now
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      })

      if (createError && !createError.message?.includes('already')) {
        console.error('post-checkout: Failed to create user', createError)
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
      }

      const userId = newUser?.user?.id
      if (userId) {
        // Wait for trigger to create public.users row
        await new Promise(resolve => setTimeout(resolve, 1000))

        const customerId = session.customer as string
        await supabase
          .from('users')
          .update({
            subscription_tier: 'premium',
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
      }
    } else if (existingUser.subscription_tier !== 'premium') {
      // User exists but not premium — upgrade them
      const customerId = session.customer as string
      await supabase
        .from('users')
        .update({
          subscription_tier: 'premium',
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id)
    }

    // Generate a magic link for auto-sign-in
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://menomind.app'}/dashboard`,
      },
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('post-checkout: Failed to generate magic link', linkError)
      // Fallback: return email so success page can show "sign in with this email"
      return NextResponse.json({ email, fallback: true })
    }

    // Build the verification URL that auto-signs them in
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const token = linkData.properties.hashed_token
    const verifyUrl = `${baseUrl}/auth/v1/verify?token=${token}&type=magiclink&redirect_to=${encodeURIComponent(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://menomind.app'}/auth/callback?next=/dashboard`
    )}`

    return NextResponse.json({ url: verifyUrl, email })
  } catch (error) {
    console.error('POST /api/auth/post-checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
