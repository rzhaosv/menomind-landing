'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function SubscriptionPage() {
  const [tier, setTier] = useState<'free' | 'premium'>('free')
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    fetchSubscription()
  }, [])

  async function fetchSubscription() {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        setTier(data.user?.subscription_tier || 'free')
      }
    } finally {
      setLoading(false)
    }
  }

  async function openCustomerPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      if (res.ok) {
        const { url } = await res.json()
        window.location.href = url
      }
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Link
          href="/settings"
          className="text-brand-purple hover:underline text-sm"
        >
          ← Back to Settings
        </Link>
        <h1 className="text-2xl font-bold text-brand-dark mt-2">
          Subscription
        </h1>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              tier === 'premium'
                ? 'bg-brand-purple text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {tier === 'premium' ? 'Premium' : 'Free'}
          </span>
        </div>

        {tier === 'premium' ? (
          <div className="space-y-4">
            <p className="text-gray-600">
              You have full access to all MenoMind features.
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Unlimited AI
                conversations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Full symptom history
                & trends
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> All 5 wellness plans
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Doctor report export
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Weekly AI insights
              </li>
            </ul>
            <button
              onClick={openCustomerPortal}
              className="btn-secondary text-sm"
              disabled={portalLoading}
            >
              {portalLoading ? 'Loading...' : 'Manage Subscription'}
            </button>
            <p className="text-xs text-gray-500">
              Update payment method, change plan, or cancel.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">
              Upgrade to Premium for unlimited access to all features.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border-2 border-brand-purple rounded-xl p-4">
                <p className="font-semibold text-brand-purple">Monthly</p>
                <p className="text-2xl font-bold mt-1">
                  $14.99<span className="text-sm font-normal">/mo</span>
                </p>
                <Link href="/pricing" className="btn-primary text-sm mt-3 block text-center">
                  Subscribe
                </Link>
              </div>
              <div className="border-2 border-brand-pink rounded-xl p-4 relative">
                <span className="absolute -top-2 right-4 bg-brand-pink text-white text-xs px-2 py-0.5 rounded-full">
                  Save $80/yr
                </span>
                <p className="font-semibold text-brand-pink">Annual</p>
                <p className="text-2xl font-bold mt-1">
                  $99<span className="text-sm font-normal">/yr</span>
                </p>
                <Link href="/pricing" className="btn-pink text-sm mt-3 block text-center">
                  Subscribe
                </Link>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              7-day free trial included. Cancel anytime.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
