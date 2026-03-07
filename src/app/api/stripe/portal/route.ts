import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCustomerPortalSession } from '@/lib/stripe/client'

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

    // Get the user's Stripe customer ID
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!userData?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Please subscribe first.' },
        { status: 400 }
      )
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await createCustomerPortalSession({
      customerId: userData.stripe_customer_id,
      returnUrl: `${origin}/dashboard/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('POST /api/stripe/portal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
