import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SYMPTOM_CATEGORIES } from '@/lib/quiz/symptom-data'
import { sendQuizResultsEmail } from '@/lib/email/quiz-results'

function determineCategoriesFromSymptoms(symptoms: string[]): string[] {
  const categories = new Set<string>()
  for (const symptom of symptoms) {
    for (const [catId, catData] of Object.entries(SYMPTOM_CATEGORIES)) {
      if (symptom in catData.symptoms) {
        categories.add(catId)
      }
    }
  }
  return Array.from(categories)
}

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

    const categories = determineCategoriesFromSymptoms(quizSymptoms || [])

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
          quiz_categories: categories,
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
    try {
      await sendQuizResultsEmail({
        email: email.trim().toLowerCase(),
        symptoms: quizSymptoms || [],
        level: quizLevel || 'unknown',
        categories,
      })
    } catch (emailError) {
      console.error('Failed to send quiz results email:', emailError)
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
