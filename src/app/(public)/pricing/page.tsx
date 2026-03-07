'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function PricingPage() {
  const [annual, setAnnual] = useState(true)
  const [loading, setLoading] = useState<string | null>(null)

  async function handleSubscribe(priceType: 'monthly' | 'annual') {
    setLoading(priceType)
    try {
      const priceId =
        priceType === 'monthly'
          ? process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY
          : process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: priceId || `price_${priceType}_placeholder` }),
      })

      if (res.ok) {
        const { url } = await res.json()
        if (url) window.location.href = url
      }
    } finally {
      setLoading(null)
    }
  }

  const features = [
    'Unlimited AI conversations',
    'Full symptom history & charts',
    'Correlation analysis',
    'All 5 personalized wellness plans',
    'Weekly AI-generated insights',
    'Doctor visit prep reports',
    'Monthly summary exports',
    'Priority support',
  ]

  const freeFeatures = [
    '5 AI messages per day',
    'Daily symptom logging',
    '7-day trend view',
    '1 starter wellness plan',
    'Basic health Q&A',
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
            Start free, upgrade when you&apos;re ready. Every plan includes a 7-day
            free trial of Premium.
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
                Save 33%
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
                  <span className="text-gray-400 mt-0.5">✓</span>
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
            <p className="text-4xl font-bold mt-2 mb-1">
              {annual ? '$99' : '$14.99'}
              <span className="text-base font-normal text-gray-500">
                /{annual ? 'year' : 'month'}
              </span>
            </p>
            {annual && (
              <p className="text-sm text-gray-500 mb-4">
                That&apos;s just $8.25/month
              </p>
            )}
            {!annual && <div className="mb-4" />}
            <button
              onClick={() => handleSubscribe(annual ? 'annual' : 'monthly')}
              className="btn-primary text-sm w-full mb-6"
              disabled={loading !== null}
            >
              {loading ? 'Loading...' : 'Start 7-Day Free Trial'}
            </button>
            <ul className="space-y-3">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-brand-purple mt-0.5">✓</span>
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
                Can I cancel my subscription anytime?
              </summary>
              <p className="mt-3 text-gray-600 text-sm">
                Yes! You can cancel anytime from your Settings page. You&apos;ll
                keep premium access until the end of your billing period.
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
            <details className="card cursor-pointer">
              <summary className="font-semibold">
                What if the trial doesn&apos;t work for me?
              </summary>
              <p className="mt-3 text-gray-600 text-sm">
                No worries! If you don&apos;t find value during your 7-day trial,
                simply don&apos;t subscribe. Your free account and data stay intact.
                We also offer a 14-day money-back guarantee on paid subscriptions.
              </p>
            </details>
          </div>
        </div>

        {/* Guarantee */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>14-day money-back guarantee · Cancel anytime · Secure payments via Stripe</p>
        </div>
      </main>
    </div>
  )
}
