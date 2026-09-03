'use client'

import { useEffect, useState } from 'react'

interface Status { live: boolean; url: string; rating?: number | null; ratingCount?: number | null }

/**
 * "Download on the App Store" CTA that stays hidden until the app is actually live.
 * Polls /api/app-store-status (cached) so launch day needs no site deploy.
 */
export function AppStoreCta({ campaign = 'site', variant = 'light', className = '' }: { campaign?: string; variant?: 'light' | 'dark'; className?: string }) {
  const [status, setStatus] = useState<Status | null>(null)

  useEffect(() => {
    let mounted = true
    fetch('/api/app-store-status')
      .then((r) => r.json())
      .then((s: Status) => { if (mounted) setStatus(s) })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  if (!status?.live) return null

  const href = `/app?ct=${encodeURIComponent(campaign)}`
  const isDark = variant === 'dark'
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <a
        href={href}
        onClick={() => { (window as any).gtag?.('event', 'app_store_cta_click', { campaign }) }}
        className={`inline-flex items-center gap-3 rounded-xl px-5 py-3 font-semibold transition-colors ${isDark ? 'bg-black text-white hover:bg-gray-900' : 'bg-white text-brand-purple hover:bg-gray-100'}`}
        aria-label="Download MenoMind on the App Store"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.365 1.43c0 1.14-.417 2.2-1.21 3.07-.95 1.06-2.09 1.67-3.31 1.57-.06-1.1.41-2.24 1.2-3.09.9-1 2.29-1.65 3.32-1.55zM20.9 17.4c-.5 1.15-.75 1.66-1.4 2.67-.9 1.4-2.17 3.14-3.75 3.15-1.4.02-1.77-.92-3.67-.91-1.9.01-2.3.93-3.71.91-1.58-.02-2.78-1.58-3.68-2.98C2.2 16.35 1.95 11.6 3.6 9.05c1.17-1.8 3.02-2.86 4.76-2.86 1.77 0 2.88 1 4.34 1 1.42 0 2.29-1 4.33-1 1.55 0 3.19.85 4.36 2.31-3.83 2.1-3.21 7.57-.49 8.9z"/></svg>
        <span className="text-left leading-tight">
          <span className="block text-[10px] uppercase tracking-wide opacity-80">Download on the</span>
          <span className="block text-base">App Store</span>
        </span>
      </a>
      {!!status.ratingCount && status.rating ? (
        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-white/80'}`}>★ {status.rating.toFixed(1)} · {status.ratingCount} ratings</p>
      ) : (
        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-white/80'}`}>Free · 7-day Premium trial</p>
      )}
    </div>
  )
}
