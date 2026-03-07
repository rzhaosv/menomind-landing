import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserTier } from '@/lib/subscription/tier'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    let days = parseInt(searchParams.get('days') || '7', 10)

    // Validate days parameter
    if (isNaN(days) || days < 1) {
      days = 7
    }

    // Check tier for history length limits
    const tier = await getUserTier(user.id)
    const maxDays = tier === 'premium' ? 365 : 7
    days = Math.min(days, maxDays)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('symptom_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDateStr)
      .order('date', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch symptom history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data,
      meta: {
        days,
        maxDays,
        tier,
        count: data.length,
      },
    })
  } catch (error) {
    console.error('GET /api/symptoms/history error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
