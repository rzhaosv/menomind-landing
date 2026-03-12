import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, quizSymptoms, quizLevel } = body as {
      email: string
      quizSymptoms?: string[]
      quizLevel?: string
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const cookieStore = cookies()
    const sessionId = cookieStore.get('anonymous_session')?.value || null

    const supabase = createClient()

    // Upsert on email to prevent duplicates
    const { error } = await supabase
      .from('checkin_signups')
      .upsert(
        {
          email: email.trim().toLowerCase(),
          anonymous_session_id: sessionId,
          quiz_symptoms: quizSymptoms || [],
          quiz_level: quizLevel || null,
        },
        { onConflict: 'email' }
      )

    if (error) {
      console.error('Checkin signup error:', error)
      return NextResponse.json(
        { error: 'Failed to save. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/waitlist/checkin error:', error)
    return NextResponse.json(
      { error: 'Something went wrong.' },
      { status: 500 }
    )
  }
}
