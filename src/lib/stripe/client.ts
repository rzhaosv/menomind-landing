import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})

export async function createCheckoutSession({
  customerId,
  priceId,
  userId,
  returnUrl,
}: {
  customerId?: string
  priceId: string
  userId: string
  returnUrl: string
}) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId || undefined,
    customer_email: customerId ? undefined : undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${returnUrl}?success=true`,
    cancel_url: `${returnUrl}?canceled=true`,
    subscription_data: {
      trial_period_days: 7,
      metadata: { userId },
    },
    metadata: { userId },
  })

  return session
}

export async function createCustomerPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

export async function getOrCreateCustomer({
  email,
  name,
  userId,
}: {
  email: string
  name?: string
  userId: string
}) {
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  })

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0]
  }

  return await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: { userId },
  })
}
