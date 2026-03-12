import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

interface SubEvent {
  user_id: string
  event_type: string
  stripe_event_id: string
  data: Record<string, unknown>
  created_at: string
}

export async function GET(request: Request) {
  try {
    // Auth check — only admin users
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createAdminClient()
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || '30d'

    const daysBack = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()

    // Run all queries in parallel
    const [
      userCountsResult,
      subscriptionEventsResult,
      featureUsageResults,
    ] = await Promise.all([
      // User counts by tier
      admin.from('users').select('subscription_tier'),

      // Subscription events in period
      admin
        .from('subscription_events')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: true }),

      // Feature usage: count of plans, symptom logs, conversations
      Promise.all([
        admin.from('wellness_plans').select('id', { count: 'exact', head: true }),
        admin.from('symptom_logs').select('id', { count: 'exact', head: true }).gte('created_at', since),
        admin.from('conversations').select('id', { count: 'exact', head: true }).gte('created_at', since),
      ]),
    ])

    // Process user counts
    const users: { subscription_tier: string }[] = userCountsResult.data || []
    const totalUsers = users.length
    const premiumUsers = users.filter((u) => u.subscription_tier === 'premium').length
    const freeUsers = totalUsers - premiumUsers

    // Process subscription events
    const events: SubEvent[] = subscriptionEventsResult.data || []
    const checkouts = events.filter((e) => e.event_type === 'checkout.session.completed')
    const cancellations = events.filter((e) => e.event_type === 'customer.subscription.deleted')
    const paymentFailures = events.filter((e) => e.event_type === 'invoice.payment_failed')

    // Estimate revenue from checkout events
    const totalRevenue = checkouts.reduce((sum: number, e: SubEvent) => {
      const amount = e.data?.amount_total
      return sum + (typeof amount === 'number' ? amount / 100 : 0)
    }, 0)

    // Trial conversion: users who went from trialing to active
    const trialStarts = checkouts.length
    const trialToActive = events.filter(
      (e: SubEvent) =>
        e.event_type === 'customer.subscription.updated' &&
        e.data?.status === 'active'
    ).length

    const conversionRate = trialStarts > 0
      ? Math.round((trialToActive / trialStarts) * 100)
      : 0

    // Churn rate
    const churnRate = premiumUsers > 0
      ? Math.round((cancellations.length / (premiumUsers + cancellations.length)) * 100)
      : 0

    // ARPU
    const arpu = premiumUsers > 0
      ? Math.round((totalRevenue / premiumUsers) * 100) / 100
      : 0

    // Feature usage
    const [plansResult, logsResult, convosResult] = featureUsageResults
    const featureUsage = {
      wellness_plans: plansResult.count ?? 0,
      symptom_logs: logsResult.count ?? 0,
      conversations: convosResult.count ?? 0,
    }

    // Revenue by day (aggregate from events)
    const revenueByDay: Record<string, number> = {}
    for (const event of checkouts) {
      const day = event.created_at.split('T')[0]
      const amount = event.data?.amount_total
      revenueByDay[day] = (revenueByDay[day] || 0) + (typeof amount === 'number' ? amount / 100 : 0)
    }

    const dailyRevenue = Object.entries(revenueByDay)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      period,
      overview: {
        totalUsers,
        premiumUsers,
        freeUsers,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        arpu,
        conversionRate,
        churnRate,
      },
      events: {
        checkouts: checkouts.length,
        cancellations: cancellations.length,
        paymentFailures: paymentFailures.length,
      },
      featureUsage,
      dailyRevenue,
    })
  } catch (error) {
    console.error('GET /api/analytics/revenue error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
