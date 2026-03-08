'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function friendlyAuthError(msg: string): string {
  const lower = msg.toLowerCase()
  if (lower.includes('rate limit')) return 'Too many attempts. Please try again in a few minutes.'
  if (lower.includes('already registered') || lower.includes('already been registered')) return 'An account with this email already exists. Try logging in instead.'
  if (lower.includes('not confirmed')) return 'Please confirm your email first. Check your inbox or click Resend below.'
  if (lower.includes('invalid login')) return 'Incorrect email or password. Please try again.'
  if (lower.includes('password') && lower.includes('weak')) return 'Password is too weak. Use at least 8 characters with a mix of letters and numbers.'
  return msg
}

export default function SignupForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    // Validation
    if (!fullName.trim()) {
      setError('Please enter your full name.')
      return
    }

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        setError(friendlyAuthError(authError.message))
        return
      }

      setSuccess(true)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignUp() {
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (oauthError) {
        setError(oauthError.message)
        setLoading(false)
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  // Success state
  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-7 w-7 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-brand-dark">
          Check your email
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          We&apos;ve sent a confirmation link to{' '}
          <span className="font-medium text-brand-dark">{email}</span>. Please
          check your inbox and click the link to activate your account.
        </p>
        <Link
          href="/login"
          className="inline-block text-sm font-medium text-brand-purple transition-colors hover:text-brand-purple-dark"
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-1 text-center text-2xl font-semibold text-brand-dark">
        Create your account
      </h2>
      <p className="mb-6 text-center text-sm text-gray-500">
        Start your wellness journey with MenoMind
      </p>

      {/* Error display */}
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Sign up with Google
      </button>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
          or
        </span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Signup form */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="signup-name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Full name
            </label>
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              placeholder="Jane Doe"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-brand-dark placeholder-gray-400 transition-colors focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="signup-email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="you@example.com"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-brand-dark placeholder-gray-400 transition-colors focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="signup-password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="Min. 8 characters"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-brand-dark placeholder-gray-400 transition-colors focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="signup-confirm-password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Confirm password
            </label>
            <input
              id="signup-confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              placeholder="Re-enter your password"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-brand-dark placeholder-gray-400 transition-colors focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center rounded-lg bg-brand-purple px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-purple-dark focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <svg
                className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Creating account…
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      {/* Footer link */}
      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-brand-purple transition-colors hover:text-brand-purple-dark"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
