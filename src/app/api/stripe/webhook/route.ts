import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import {
    handleCheckoutCompleted,
    handleSubscriptionUpdated,
    handleSubscriptionDeleted,
    handleInvoicePaymentFailed,
} from '@/lib/stripe/webhooks'
import type Stripe from 'stripe'

export async function POST(request: Request) {
    try {
          // Use raw text body for webhook signature verification
      const body = await request.text()
          const signature = request.headers.get('stripe-signature')

      if (!signature) {
              return NextResponse.json(
                { error: 'Missing stripe-signature header' },
                { status: 400 }
                      )
      }

      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
          if (!webhookSecret) {
                  console.error('STRIPE_WEBHOOK_SECRET not configured')
                  return NextResponse.json(
                    { error: 'Webhook secret not configured' },
                    { status: 500 }
                          )
          }

      let event: Stripe.Event

      try {
              event = getStripe().webhooks.constructEvent(body, signature, webhookSecret)
      } catch (err) {
              const message = err instanceof Error ? err.message : 'Unknown error'
              console.error('Webhook signature verification failed:', message)
              return NextResponse.json(
                { error: `Webhook signature verification failed: ${message}` },
                { status: 400 }
                      )
      }

      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
                  await handleCheckoutCompleted(
                              event.data.object as Stripe.Checkout.Session
                            )
                  break

        case 'customer.subscription.updated':
                  await handleSubscriptionUpdated(
                              event.data.object as Stripe.Subscription
                            )
                  break

        case 'customer.subscription.deleted':
                  await handleSubscriptionDeleted(
                              event.data.object as Stripe.Subscription
                            )
                  break

        case 'invoice.payment_failed':
                  await handleInvoicePaymentFailed(
                              event.data.object as Stripe.Invoice
                            )
                  break

        default:
                  console.log(`Unhandled event type: ${event.type}`)
      }

      return NextResponse.json({ received: true })
    } catch (error) {
          console.error('POST /api/stripe/webhook error:', error)
          return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
                )
    }
}
