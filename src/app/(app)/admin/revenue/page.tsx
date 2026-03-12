'use client'

import { useEffect, useState } from 'react'

interface RevenueData {
  period: string
  overview: {
    totalUsers: number
    premiumUsers: number
    freeUsers: number
    totalRevenue: number
    arpu: number
    conversionRate: number
    churnRate: number
  }
  events: {
    checkouts: number
    cancellations: number
    paymentFailures: number
  }
  featureUsage: {
    wellness_plans: number
    symptom_logs: number
    conversations: number
  }
  dailyRevenue: { date: string; amount: number }[]
}

export default function RevenueAdminPage() {
  const [data, setData] = useState<RevenueData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/analytics/revenue?period=${period}`)
        if (!res.ok) {
          const body = await res.json()
          setError(body.error || 'Failed to load')
          return
        }
        setData(await res.json())
        setError(null)
      } catch {
        setError('Failed to fetch analytics')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [period])

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Revenue Analytics</h1>
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Revenue Analytics</h1>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
      </div>
    )
  }

  if (!data) return null

  const { overview, events, featureUsage, dailyRevenue } = data

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Revenue Analytics</h1>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-brand-purple text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Revenue" value={`$${overview.totalRevenue}`} />
        <MetricCard label="ARPU" value={`$${overview.arpu}`} />
        <MetricCard label="Conversion Rate" value={`${overview.conversionRate}%`} />
        <MetricCard label="Churn Rate" value={`${overview.churnRate}%`} />
      </div>

      {/* User Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <MetricCard label="Total Users" value={overview.totalUsers.toString()} />
        <MetricCard label="Premium Users" value={overview.premiumUsers.toString()} accent />
        <MetricCard label="Free Users" value={overview.freeUsers.toString()} />
      </div>

      {/* Events */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">Subscription Events</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Checkouts</p>
            <p className="text-2xl font-bold text-green-600">{events.checkouts}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Cancellations</p>
            <p className="text-2xl font-bold text-red-500">{events.cancellations}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Payment Failures</p>
            <p className="text-2xl font-bold text-amber-500">{events.paymentFailures}</p>
          </div>
        </div>
      </div>

      {/* Feature Usage */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">Feature Usage (Period)</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Conversations</p>
            <p className="text-2xl font-bold">{featureUsage.conversations}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Symptom Logs</p>
            <p className="text-2xl font-bold">{featureUsage.symptom_logs}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Wellness Plans</p>
            <p className="text-2xl font-bold">{featureUsage.wellness_plans}</p>
          </div>
        </div>
      </div>

      {/* Daily Revenue Chart (simple bar chart with CSS) */}
      {dailyRevenue.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Daily Revenue</h2>
          <div className="flex items-end gap-1 h-40">
            {dailyRevenue.map((day) => {
              const maxAmount = Math.max(...dailyRevenue.map((d) => d.amount), 1)
              const height = (day.amount / maxAmount) * 100
              return (
                <div
                  key={day.date}
                  className="flex-1 group relative"
                  title={`${day.date}: $${day.amount}`}
                >
                  <div
                    className="bg-brand-purple rounded-t w-full transition-all hover:opacity-80"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                    {day.date}: ${day.amount}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{dailyRevenue[0]?.date}</span>
            <span>{dailyRevenue[dailyRevenue.length - 1]?.date}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-brand-purple' : ''}`}>
        {value}
      </p>
    </div>
  )
}
