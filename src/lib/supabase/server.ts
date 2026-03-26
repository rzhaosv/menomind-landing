import { createServerClient } from '@supabase/ssr'
import { createClient as createJsClient } from '@supabase/supabase-js'
import { cookies, headers } from 'next/headers'

/**
 * Creates a Supabase server client.
 * Supports both cookie-based auth (web) and Bearer token auth (React Native).
 */
export function createClient() {
  // Check for Bearer token from mobile clients
  const headerStore = headers()
  const authorization = headerStore.get('authorization')
  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.slice(7)
    return createJsClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    )
  }

  // Default: cookie-based auth for web
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component - can't set cookies
          }
        },
      },
    }
  )
}
