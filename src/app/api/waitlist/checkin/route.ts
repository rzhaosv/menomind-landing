import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendQuizResultsEmail } from '@/lib/email/quiz-results'
import { sendNurtureEmail } from '@/lib/email/retention-sequences'

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

    const supabase = createAdminClient()

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

    // Send quiz results email (non-blocking — don't fail the request if email fails)
    const cleanEmail = email.trim().toLowerCase()
    const symptoms = quizSymptoms || []
    const level = quizLevel || 'unknown'

    try {
      await sendQuizResultsEmail({
        email: cleanEmail,
        symptoms,
        level,
        categories: [],
      })
    } catch (emailError) {
      console.error('Failed to send quiz results email:', emailError)
    }

    // Schedule nurture email for 48h later
    try {
      const token = Buffer.from(JSON.stringify({
        symptoms,
        level,
      })).toString('base64url')
      const resultsUrl = `https://menomind.app/results?token=${token}`

      await sendNurtureEmail(cleanEmail, resultsUrl, new Date(Date.now() + 48 * 60 * 60 * 1000))
    } catch (emailError) {
      console.error('Failed to schedule nurture email:', emailError)
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
