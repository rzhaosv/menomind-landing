import { NextResponse } from 'next/server'

export const revalidate = 1800 // re-check the App Store every 30 minutes

const APP_ID = '6761165992'

/**
 * Reports whether the iOS app is live on the App Store so the site can show
 * download CTAs automatically the moment Apple releases 1.0 (no deploy needed).
 */
export async function GET() {
  try {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${APP_ID}&country=us`, { next: { revalidate: 1800 } })
    const json = await res.json()
    const app = json?.results?.[0]
    return NextResponse.json(
      {
        live: !!app,
        url: `https://apps.apple.com/app/id${APP_ID}`,
        version: app?.version ?? null,
        rating: app?.averageUserRating ?? null,
        ratingCount: app?.userRatingCount ?? null,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' } }
    )
  } catch {
    return NextResponse.json({ live: false, url: `https://apps.apple.com/app/id${APP_ID}` })
  }
}
