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
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-5">
      <div className="max-w-md mx-auto text-center">
        <div className="text-5xl mb-6">🎉</div>
        <h1 className="text-2xl font-bold mb-3">Welcome to MenoMind Premium</h1>
        <p className="text-gray-600 mb-2">
          You now have unlimited access to your AI menopause companion, full symptom tracking, and personalized wellness plans.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Your $1 first-week access is active. Check your email for a confirmation.
        </p>
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block bg-brand-purple hover:bg-brand-purple-dark text-white text-center py-4 px-6 rounded-xl font-semibold transition-colors"
          >
            Go to My Dashboard
          </Link>
          <Link
            href="/try"
            className="block text-brand-purple hover:text-brand-purple-dark text-center py-3 px-6 rounded-xl font-medium transition-colors"
          >
            Talk to Your AI Companion
          </Link>
        </div>
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
