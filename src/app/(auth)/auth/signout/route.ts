import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient()
  await supabase.auth.signOut()

  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://menomind.app'
  return NextResponse.redirect(`${origin}/`)
}
