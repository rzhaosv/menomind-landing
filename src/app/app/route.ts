import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const APP_STORE_URL = 'https://apps.apple.com/app/id6761165992'

/** Short link for ads, emails and bios: menomind.app/app?ct=<campaign> → App Store product page. */
export function GET(request: Request) {
  const url = new URL(request.url)
  const ct = url.searchParams.get('ct') || url.searchParams.get('utm_campaign') || undefined
  const target = new URL(APP_STORE_URL)
  if (ct) {
    target.searchParams.set('ct', ct.slice(0, 40))
    target.searchParams.set('mt', '8')
  }
  return NextResponse.redirect(target.toString(), 302)
}
