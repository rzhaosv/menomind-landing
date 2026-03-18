import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email/resend'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Send welcome email for new users (non-blocking)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const isNewUser = user.created_at &&
          (Date.now() - new Date(user.created_at).getTime()) < 60_000 // created within last 60s
        if (isNewUser) {
          const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there'
          sendWelcomeEmail(user.email!, name).catch((err) =>
            console.error('Failed to send welcome email:', err)
          )
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
