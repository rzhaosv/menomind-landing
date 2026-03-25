import { NextResponse } from 'next/server'
import { createReportCheckoutSession } from '@/lib/stripe/client'

/**
 * Quiz paywall checkout — creates a one-time $37 payment for the report.
 * No auth required (anonymous quiz flow).
 */
export async function POST(request: Request) {
  try {
    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://menomind.app'

    const session = await createReportCheckoutSession({
      userId: 'anonymous',
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
