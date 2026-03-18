'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')
  const [tracked, setTracked] = useState(false)

  useEffect(() => {
    if (success && !tracked) {
      // Client-side Meta Pixel Purchase event (deduped with server CAPI via event_id)
      const sessionId = searchParams.get('session_id');
      (window as any).fbq?.('track', 'Purchase', {
        value: 1.00,
        currency: 'USD',
        content_name: 'MenoMind Premium',
      }, { eventID: sessionId || undefined });

      // Google Ads conversion
      (window as any).gtag?.('event', 'conversion', {
        'send_to': 'AW-17830146300/qbF8CJjiioccEPzhibZC',
        value: 1.0,
        currency: 'USD',
        transaction_id: sessionId || undefined,
      });

      setTracked(true)
    }
  }, [success, tracked, searchParams])

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

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center px-5 py-12">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-2">Welcome to MenoMind Premium</h1>
          <p className="text-gray-600 text-sm">
            Your $1 first-week access is active. Here&apos;s how to get the most out of it.
          </p>
        </div>

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
