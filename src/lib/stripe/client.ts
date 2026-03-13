import Stripe from 'stripe'

let _stripe: Stripe | null = null

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(key, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  }
  return _stripe
}

export { getStripe }

/**
 * Create a checkout session with $1 first-week trial.
 *
 * Approach: 7-day free trial on the subscription + a $1 one-time setup fee
 * charged immediately at checkout. After 7 days, the regular recurring
 * price kicks in automatically. This is the cleanest Stripe pattern —
 * no subscription schedules, no coupons, no phase juggling.
 */
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
  const stripe = getStripe()

  // Get or create the $1 intro price
  const introPrice = await getOrCreateIntroPrice()

  // Build line items: recurring subscription + one-time $1 intro fee
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    { price: priceId, quantity: 1 },
  ]
  if (introPrice) {
    lineItems.push({ price: introPrice.id, quantity: 1 })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId || undefined,
    line_items: lineItems,
    mode: 'subscription',
    success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${returnUrl}?canceled=true`,
    subscription_data: {
      trial_period_days: 7,
      metadata: { userId },
    },
    metadata: { userId },
    allow_promotion_codes: true,
    custom_text: {
      submit: {
        message:
          'You\'ll be charged $1 today for your first week. After 7 days, your subscription begins at the regular price. Cancel anytime for a full refund.',
      },
    },
  })

  return session
}

/**
 * Get or create the $1 intro price (one-time, used as trial payment).
 * Looks up by metadata to avoid creating duplicates.
 */
async function getOrCreateIntroPrice(): Promise<Stripe.Price | null> {
  const stripe = getStripe()

  try {
    // Search for existing intro price by metadata
    const prices = await stripe.prices.list({
      limit: 20,
      active: true,
      type: 'one_time',
    })

    const existingIntro = prices.data.find(
      (p) => p.unit_amount === 100 && p.metadata?.purpose === 'trial_intro'
    )

    if (existingIntro) return existingIntro

    // Create the $1 intro product and price
    const product = await stripe.products.create({
      name: 'MenoMind — First Week Access',
      metadata: { purpose: 'trial_intro' },
    })

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 100, // $1.00
      currency: 'usd',
      metadata: { purpose: 'trial_intro' },
    })

    return price
  } catch (error) {
    console.error('Failed to get/create intro price:', error)
    return null
  }
}

export async function createCustomerPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}) {
  const stripe = getStripe()
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
  const stripe = getStripe()
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
