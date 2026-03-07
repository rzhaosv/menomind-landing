import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface TrendResult {
  symptom: string
  average: number
  trend: 'improving' | 'worsening' | 'stable'
  dataPoints: { date: string; value: number }[]
}

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
    const days = parseInt(searchParams.get('days') || '7', 10)

    if (![7, 30].includes(days)) {
      return NextResponse.json(
        { error: 'Days must be 7 or 30' },
        { status: 400 }
      )
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    const { data: logs, error } = await supabase
      .from('symptom_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDateStr)
      .order('date', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch symptom data' },
        { status: 500 }
      )
    }

    if (!logs || logs.length === 0) {
      return NextResponse.json({
        data: {
          trends: [],
          period: days,
          totalEntries: 0,
        },
      })
    }

    // Aggregate symptoms across all logs
    const symptomData: Record<string, { date: string; value: number }[]> = {}

    for (const log of logs) {
      const symptoms = log.symptoms as Record<string, number>
      for (const [symptom, value] of Object.entries(symptoms)) {
        if (!symptomData[symptom]) {
          symptomData[symptom] = []
        }
        symptomData[symptom].push({ date: log.date, value })
      }
    }

    // Calculate trends for each symptom
    const trends: TrendResult[] = Object.entries(symptomData).map(
      ([symptom, dataPoints]) => {
        const values = dataPoints.map((dp) => dp.value)
        const average =
          values.reduce((sum, v) => sum + v, 0) / values.length

        // Determine trend by comparing first half average to second half average
        let trend: 'improving' | 'worsening' | 'stable' = 'stable'
        if (dataPoints.length >= 2) {
          const midpoint = Math.floor(dataPoints.length / 2)
          const firstHalf = values.slice(0, midpoint)
          const secondHalf = values.slice(midpoint)

          const firstAvg =
            firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length
          const secondAvg =
            secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length

          const threshold = 0.3
          if (secondAvg < firstAvg - threshold) {
            trend = 'improving'
          } else if (secondAvg > firstAvg + threshold) {
            trend = 'worsening'
          }
        }

        return {
          symptom,
          average: Math.round(average * 100) / 100,
          trend,
          dataPoints,
        }
      }
    )

    return NextResponse.json({
      data: {
        trends,
        period: days,
        totalEntries: logs.length,
      },
    })
  } catch (error) {
    console.error('GET /api/symptoms/trends error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
