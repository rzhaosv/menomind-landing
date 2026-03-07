import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const { date, symptoms, notes } = body as {
      date: string
      symptoms: Record<string, number>
      notes?: string
    }

    if (!date || !symptoms) {
      return NextResponse.json(
        { error: 'Date and symptoms are required' },
        { status: 400 }
      )
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Validate symptom values (1-5)
    for (const [key, value] of Object.entries(symptoms)) {
      if (typeof value !== 'number' || value < 0 || value > 5) {
        return NextResponse.json(
          { error: `Invalid severity for ${key}. Must be 0-5` },
          { status: 400 }
        )
      }
    }

    // Upsert on (user_id, date)
    const { data, error } = await supabase
      .from('symptom_logs')
      .upsert(
        {
          user_id: user.id,
          date,
          symptoms,
          notes: notes || null,
        },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single()

    if (error) {
      console.error('Symptom log upsert error:', error)
      return NextResponse.json(
        { error: 'Failed to log symptoms' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('POST /api/symptoms/log error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
