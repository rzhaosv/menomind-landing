import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Record<string, unknown>)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated and trying to access app routes
  const isAppRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/chat') ||
    request.nextUrl.pathname.startsWith('/track') ||
    request.nextUrl.pathname.startsWith('/plans') ||
    request.nextUrl.pathname.startsWith('/settings') ||
    request.nextUrl.pathname.startsWith('/onboarding')

  if (!user && isAppRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users from homepage to dashboard
  if (user && request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (
    user &&
    (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Auto-redirect new users to onboarding (skip the friction)
  if (user && isAppRoute && !request.nextUrl.pathname.startsWith('/onboarding')) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .single()

    if (!profile?.onboarding_completed) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
