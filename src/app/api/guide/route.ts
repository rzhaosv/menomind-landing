import { NextRequest, NextResponse } from 'next/server'
import { sendFreeGuideEmail } from '@/lib/email/resend'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    await sendFreeGuideEmail(email)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to send guide email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
