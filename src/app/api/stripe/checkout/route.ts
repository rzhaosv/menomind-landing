import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession, getOrCreateCustomer } from '@/lib/stripe/client'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { priceId } = body as { priceId: string }

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    // Get user data for customer creation
    const { data: userData } = await supabase
      .from('users')
      .select('email, full_name, stripe_customer_id')
      .eq('id', user.id)
      .single()

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer({
      email: userData?.email || user.email!,
      name: userData?.full_name || undefined,
      userId: user.id,
    })

    // Save Stripe customer ID if not already saved
    if (!userData?.stripe_customer_id) {
      await supabase
        .from('users')
        .update({
          stripe_customer_id: customer.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await createCheckoutSession({
      customerId: customer.id,
      priceId,
      userId: user.id,
      returnUrl: `${origin}/dashboard/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('POST /api/stripe/checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
