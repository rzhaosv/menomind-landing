'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')
  const sessionId = searchParams.get('session_id')
  const [tracked, setTracked] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [fallbackEmail, setFallbackEmail] = useState<string | null>(null)

  // Track purchase conversion
  useEffect(() => {
    if (success && !tracked) {
      (window as any).fbq?.('track', 'Purchase', {
        value: 1.00,
        currency: 'USD',
        content_name: 'MenoMind Premium',
      }, { eventID: sessionId || undefined });

      (window as any).gtag?.('event', 'conversion', {
        'send_to': 'AW-17830146300/qbF8CJjiioccEPzhibZC',
        value: 1.0,
        currency: 'USD',
        transaction_id: sessionId || undefined,
      });

      setTracked(true)
    }
  }, [success, tracked, sessionId])

  // Auto-sign in after checkout
  useEffect(() => {
    if (success && sessionId && !signingIn) {
      setSigningIn(true)

      fetch('/api/auth/post-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.url && !data.fallback) {
            // Auto-redirect to magic link — signs them in
            window.location.href = data.url
          } else if (data.email) {
            // Fallback: show email to sign in with
            setFallbackEmail(data.email)
            setSigningIn(false)
          } else {
            setSigningIn(false)
          }
        })
        .catch(() => setSigningIn(false))
    }
  }, [success, sessionId, signingIn])

  if (canceled) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center px-5">
        <div className="max-w-md mx-auto text-center">
          <div className="text-5xl mb-6">💜</div>
          <h1 className="text-2xl font-bold mb-3">No worries</h1>
          <p className="text-gray-600 mb-6">
            Your free features are still here whenever you need them. You can upgrade anytime.
          </p>
          <Link href="/try" className="btn-primary inline-block">
            Continue Chatting
          </Link>
        </div>
      </div>
    )
  }

  // Show loading while auto-signing in
  if (signingIn) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center px-5">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin" />
          <h1 className="text-xl font-bold mb-2">Setting up your account...</h1>
          <p className="text-gray-500 text-sm">This only takes a moment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center px-5 py-12">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-2">Welcome to MenoMind Premium</h1>
          <p className="text-gray-600 text-sm">
            {fallbackEmail
              ? `Your account is ready. Sign in with ${fallbackEmail} to get started.`
              : "Your $1 first-week access is active. Here\u0027s how to get the most out of it."}
          </p>
        </div>

        {fallbackEmail && (
          <div className="bg-brand-purple/5 rounded-xl p-4 mb-6 text-center">
            <Link
              href={`/login`}
              className="btn-primary inline-block text-sm"
            >
              Sign In to Your Account
            </Link>
          </div>
        )}

        {/* Quick-start checklist */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-4">
            Your first week checklist
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-base">💬</span>
              </div>
              <div>
                <p className="text-sm font-semibold">Talk to your AI companion</p>
                <p className="text-xs text-gray-500">
                  Ask anything about your symptoms — get personalized, evidence-based answers 24/7
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-pink/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-base">📊</span>
              </div>
              <div>
                <p className="text-sm font-semibold">Log your symptoms daily</p>
                <p className="text-xs text-gray-500">
                  Track patterns over time — after 7 days you&apos;ll start seeing trends
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-base">🩺</span>
              </div>
              <div>
                <p className="text-sm font-semibold">Generate a doctor-ready report</p>
                <p className="text-xs text-gray-500">
                  After a week of tracking, download a report to bring to your next appointment
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly email note */}
        <div className="bg-brand-purple/5 rounded-xl p-4 mb-6 text-center">
          <p className="text-sm text-gray-600">
            📧 Your weekly check-in email arrives every <strong>Monday</strong> with personalized insights based on your symptom patterns.
          </p>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block bg-brand-purple hover:bg-brand-purple-dark text-white text-center py-4 px-6 rounded-xl font-semibold transition-colors"
          >
            Go to My Dashboard
          </Link>
          <Link
            href="/chat"
            className="block bg-brand-pink hover:bg-brand-pink/90 text-white text-center py-3 px-6 rounded-xl font-medium transition-colors"
          >
            Start Your First AI Conversation
          </Link>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          Check your email for a welcome message with everything you need to get started.
        </p>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">💜</div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
