import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWeeklyInsight } from '@/lib/email/weekly-insights'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: Request) {
  // Verify cron secret (Vercel Cron or manual trigger)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Get all premium users with email
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name')
    .eq('subscription_tier', 'premium')

  if (usersError || !users) {
    console.error('weekly-insights cron: Failed to fetch users', usersError)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  let sent = 0
  let errors = 0

  for (const user of users) {
    if (!user.email) continue

    try {
      // Fetch this week's symptom logs
      const { data: thisWeekLogs } = await supabase
        .from('symptom_logs')
        .select('symptoms, date')
        .eq('user_id', user.id)
        .gte('date', sevenDaysAgo)
        .order('date', { ascending: true })

      // Fetch last week's symptom logs for comparison
      const { data: lastWeekLogs } = await supabase
        .from('symptom_logs')
        .select('symptoms, date')
        .eq('user_id', user.id)
        .gte('date', fourteenDaysAgo)
        .lt('date', sevenDaysAgo)

      // Calculate averages for this week
      const thisWeekAvg: Record<string, { total: number; count: number }> = {}
      for (const log of thisWeekLogs || []) {
        const symptoms = log.symptoms as Record<string, number>
        for (const [name, value] of Object.entries(symptoms)) {
          if (!thisWeekAvg[name]) thisWeekAvg[name] = { total: 0, count: 0 }
          thisWeekAvg[name].total += value
          thisWeekAvg[name].count++
        }
      }

      // Calculate averages for last week
      const lastWeekAvg: Record<string, { total: number; count: number }> = {}
      for (const log of lastWeekLogs || []) {
        const symptoms = log.symptoms as Record<string, number>
        for (const [name, value] of Object.entries(symptoms)) {
          if (!lastWeekAvg[name]) lastWeekAvg[name] = { total: 0, count: 0 }
          lastWeekAvg[name].total += value
          lastWeekAvg[name].count++
        }
      }

      // Build trends
      const trends = Object.entries(thisWeekAvg).map(
        ([name, { total, count }]) => {
          const thisAvg = total / count
          const lastData = lastWeekAvg[name]
          const lastAvg = lastData ? lastData.total / lastData.count : null

          let change: 'improved' | 'worsened' | 'stable' | 'new' = 'new'
          if (lastAvg !== null) {
            const diff = thisAvg - lastAvg
            if (diff < -0.3) change = 'improved'
            else if (diff > 0.3) change = 'worsened'
            else change = 'stable'
          }

          return { name, thisWeek: thisAvg, lastWeek: lastAvg, change }
        }
      )

      // Sort: worsened first, then improved, then stable
      const priority = { worsened: 0, improved: 1, new: 2, stable: 3 }
      trends.sort((a, b) => priority[a.change] - priority[b.change])

      await sendWeeklyInsight({
        email: user.email,
        name: user.full_name || 'there',
        trends,
        daysLogged: (thisWeekLogs || []).length,
      })

      sent++
    } catch (error) {
      console.error(
        `weekly-insights cron: Failed for user ${user.id}`,
        error
      )
      errors++
    }
  }

  console.log(
    `weekly-insights cron: Sent ${sent} emails, ${errors} errors, ${users.length} total users`
  )

  return NextResponse.json({
    sent,
    errors,
    total: users.length,
  })
}
