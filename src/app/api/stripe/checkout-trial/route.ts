import { NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe/client'

/**
 * Anonymous trial checkout — no auth required.
 * Creates a Stripe Checkout session with $1 first-week trial.
 * Stripe captures the email at checkout. The webhook handler
 * creates the user account upon successful payment.
 */
export async function POST(request: Request) {
  try {
    // Accept optional billingCycle from quiz paywall
    let billingCycle: string | undefined
    try {
      const body = await request.json()
      billingCycle = body.billingCycle
    } catch {
      // No body or invalid JSON — use default (monthly)
    }

    const priceId =
      billingCycle === 'annual'
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL || process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || 'price_monthly_placeholder'
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || 'price_monthly_placeholder'

    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://menomind.app'

    const session = await createCheckoutSession({
      priceId,
      userId: 'anonymous', // resolved in webhook after checkout
      returnUrl: `${origin}/success`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('POST /api/stripe/checkout-trial error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
