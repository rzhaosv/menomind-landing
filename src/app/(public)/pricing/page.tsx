'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function PricingPage() {
  const [annual, setAnnual] = useState(true)
  const [loading, setLoading] = useState<string | null>(null)
  const [showWhyDollar, setShowWhyDollar] = useState(false)

  async function handleSubscribe(priceType: 'monthly' | 'annual') {
    setLoading(priceType)

    // Track conversion events
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      if (typeof w.gtag === 'function') {
        w.gtag('event', 'pricing_trial_click', { plan: priceType });
        w.gtag('event', 'conversion', {
          'send_to': 'AW-17830146300/qbF8CJjiioccEPzhibZC',
          'value': 1.0,
          'currency': 'USD',
        });
      }
      if (typeof w.fbq === 'function') {
        w.fbq('track', 'InitiateCheckout');
      }
    }

    try {
      // Try authenticated checkout first, fall back to anonymous trial
      const priceId =
        priceType === 'monthly'
          ? process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY
          : process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL

      let res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: priceId || `price_${priceType}_placeholder` }),
      })

      // If not authenticated, use the anonymous trial endpoint
      if (res.status === 401) {
        res = await fetch('/api/stripe/checkout-trial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      }

      if (res.ok) {
        const { url } = await res.json()
        if (url) window.location.href = url
      }
    } finally {
      setLoading(null)
    }
  }

  const premiumFeatures = [
    'Unlimited AI conversations with full interpretation',
    'Personalized action plans & strategies',
    'Full symptom history & trend analysis',
    'Correlation insights across symptoms',
    'All 5 personalized wellness plans',
    'Weekly AI-generated insights',
    'Doctor visit prep reports',
    'Data export',
  ]

  const freeFeatures = [
    'Unlimited AI conversation (recognition mode)',
    'Daily symptom logging',
    '7-day trend view',
    'Pattern reflection & validation',
  ]

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-brand-purple">
            MenoMind
          </Link>
          <Link href="/login" className="text-brand-purple hover:underline font-medium">
            Sign In
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-brand-dark mb-4">
            Your menopause companion,
            <br />
            <span className="text-brand-purple">personalized to you</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start with a conversation. Upgrade when you want answers.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span
              className={`font-medium ${!annual ? 'text-brand-dark' : 'text-gray-400'}`}
            >
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                annual ? 'bg-brand-purple' : 'bg-gray-300'
              }`}
              aria-label="Toggle annual billing"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                  annual ? 'translate-x-7' : ''
                }`}
              />
            </button>
            <span
              className={`font-medium ${annual ? 'text-brand-dark' : 'text-gray-400'}`}
            >
              Annual
              <span className="ml-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Save $80/yr
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free */}
          <div className="card border-2 border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700">Free</h3>
            <p className="text-4xl font-bold mt-2 mb-4">
              $0
              <span className="text-base font-normal text-gray-500">/forever</span>
            </p>
            <Link
              href="/signup"
              className="btn-secondary text-sm w-full block text-center mb-6"
            >
              Get Started Free
            </Link>
            <ul className="space-y-3">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-gray-400 mt-0.5">&#10003;</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Premium */}
          <div className="card border-2 border-brand-purple relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-purple text-white text-xs font-semibold px-4 py-1 rounded-full">
              Most Popular
            </span>
            <h3 className="text-lg font-semibold text-brand-purple">Premium</h3>

            {/* $1 trial pricing */}
            <div className="mt-2 mb-1">
              <span className="text-4xl font-bold">$1</span>
              <span className="text-base font-normal text-gray-500"> for your first week</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Then {annual ? '$99/year ($8.25/mo)' : '$14.99/month'}. Cancel anytime.
            </p>

            <button
              onClick={() => handleSubscribe(annual ? 'annual' : 'monthly')}
              className="btn-primary text-sm w-full mb-4"
              disabled={loading !== null}
            >
              {loading ? 'Loading...' : 'Try it for $1'}
            </button>

            {/* Trust signals */}
            <div className="flex items-center justify-center gap-1 mb-6">
              <span className="text-xs text-gray-500">
                Cancel anytime in the first 7 days for a full refund
              </span>
              <button
                onClick={() => setShowWhyDollar(!showWhyDollar)}
                className="text-xs text-brand-purple hover:underline ml-2"
              >
                Why $1?
              </button>
            </div>

            {/* Why $1 tooltip */}
            {showWhyDollar && (
              <div className="bg-purple-50 rounded-lg p-3 mb-4 text-xs text-gray-600 leading-relaxed">
                We charge $1 instead of offering a free trial because we want members who
                are genuinely ready to invest in understanding their body. You&apos;ll have
                full access to everything for 7 days.
              </div>
            )}

            <ul className="space-y-3">
              {premiumFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-brand-purple mt-0.5">&#10003;</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <details className="card cursor-pointer">
              <summary className="font-semibold">
                Is MenoMind a substitute for a doctor?
              </summary>
              <p className="mt-3 text-gray-600 text-sm">
                No. MenoMind is a wellness companion that provides evidence-based
                information and support. It does not diagnose conditions or replace
                medical advice. Always consult your healthcare provider for medical
                decisions.
              </p>
            </details>
            <details className="card cursor-pointer">
              <summary className="font-semibold">
                What happens after the $1 trial week?
              </summary>
              <p className="mt-3 text-gray-600 text-sm">
                After 7 days, your subscription continues at the regular price
                ({annual ? '$99/year' : '$14.99/month'}). You can cancel anytime
                before that and you&apos;ll only pay the $1. Your free account and
                data stay intact either way.
              </p>
            </details>
            <details className="card cursor-pointer">
              <summary className="font-semibold">
                What&apos;s the difference between free and premium chat?
              </summary>
              <p className="mt-3 text-gray-600 text-sm">
                With the free plan, MenoMind listens to everything you share, reflects
                your patterns back, and validates your experience — unlimited. Premium
                unlocks the interpretation layer: personalized explanations of WHY your
                symptoms are happening, action plans tailored to you, trend analysis,
                doctor prep reports, and weekly insights.
              </p>
            </details>
            <details className="card cursor-pointer">
              <summary className="font-semibold">
                How is my health data protected?
              </summary>
              <p className="mt-3 text-gray-600 text-sm">
                Your data is encrypted at rest and in transit. We never share your
                data with third parties. You can export or delete all your data at
                any time.
              </p>
            </details>
          </div>
        </div>

        {/* Guarantee */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>Full refund within 7 days · Cancel anytime · Secure payments via Stripe</p>
        </div>
      </main>
    </div>
  )
}
