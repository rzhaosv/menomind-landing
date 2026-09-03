import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPurchaseEvent } from '@/lib/meta/conversions-api'

/**
 * RevenueCat webhook → Supabase users.subscription_tier
 *
 * RevenueCat sends an event for every subscription lifecycle change. The mobile
 * app identifies users to RevenueCat with their Supabase auth user id, so
 * `app_user_id` (or `original_app_user_id`) maps directly to public.users.id.
 *
 * Auth: RevenueCat is configured to send `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>`.
 * Docs: https://www.revenuecat.com/docs/integrations/webhooks
 */

const PREMIUM_ENTITLEMENT = 'premium'

// Events that mean "the user currently has access"
const GRANT_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'NON_RENEWING_PURCHASE',
  'UNCANCELLATION',
  'PRODUCT_CHANGE',
  'SUBSCRIPTION_EXTENDED',
  'TEMPORARY_ENTITLEMENT_GRANT',
])

// Events that mean "access has ended"
const REVOKE_EVENTS = new Set(['EXPIRATION', 'SUBSCRIPTION_PAUSED'])

// Events that carry no tier change on their own
// CANCELLATION = auto-renew turned off, access continues until EXPIRATION
// BILLING_ISSUE = grace period, keep access until EXPIRATION
// TRANSFER handled below

interface RevenueCatEvent {
  id: string
  type: string
  app_user_id: string
  original_app_user_id: string
  aliases?: string[]
  product_id?: string
  entitlement_ids?: string[] | null
  period_type?: string
  purchased_at_ms?: number
  expiration_at_ms?: number | null
  store?: string
  environment?: 'SANDBOX' | 'PRODUCTION'
  price?: number | null
  price_in_purchased_currency?: number | null
  currency?: string | null
  transferred_from?: string[]
  transferred_to?: string[]
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function pickUserId(event: RevenueCatEvent): string | null {
  const candidates = [event.app_user_id, event.original_app_user_id, ...(event.aliases ?? [])]
  return candidates.find((c) => c && UUID_RE.test(c)) ?? null
}

export async function POST(request: Request) {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET
  if (!secret) {
    console.error('revenuecat/webhook: REVENUECAT_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const auth = request.headers.get('authorization') || ''
  const provided = auth.startsWith('Bearer ') ? auth.slice(7) : auth
  if (provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { event?: RevenueCatEvent; api_version?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = body.event
  if (!event?.type) {
    return NextResponse.json({ error: 'Missing event' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Idempotency: RevenueCat retries; skip events we've already applied
  const { data: seen } = await supabase
    .from('subscription_events')
    .select('id')
    .eq('stripe_event_id', `rc_${event.id}`)
    .maybeSingle()
  if (seen) {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  // TRANSFER: entitlement moved between app user ids (e.g. restore on a new account)
  if (event.type === 'TRANSFER') {
    const from = (event.transferred_from ?? []).filter((id) => UUID_RE.test(id))
    const to = (event.transferred_to ?? []).filter((id) => UUID_RE.test(id))
    if (from.length) {
      await supabase.from('users').update({ subscription_tier: 'free', updated_at: new Date().toISOString() }).in('id', from)
    }
    if (to.length) {
      await supabase.from('users').update({ subscription_tier: 'premium', updated_at: new Date().toISOString() }).in('id', to)
    }
    if (to[0] || from[0]) {
      await supabase.from('subscription_events').insert({
        user_id: to[0] || from[0],
        event_type: `revenuecat.${event.type}`,
        stripe_event_id: `rc_${event.id}`,
        data: { from, to, store: event.store, environment: event.environment },
      })
    }
    return NextResponse.json({ ok: true })
  }

  const userId = pickUserId(event)
  if (!userId) {
    // Anonymous RevenueCat id ($RCAnonymousID:...) with no Supabase alias yet.
    // The app calls Purchases.logIn(userId) right after auth, which triggers a
    // TRANSFER/alias, so this is safe to acknowledge.
    console.warn('revenuecat/webhook: no Supabase user id on event', event.type, event.app_user_id)
    return NextResponse.json({ ok: true, ignored: 'no_user' })
  }

  const hasPremiumEntitlement =
    !event.entitlement_ids || event.entitlement_ids.length === 0 || event.entitlement_ids.includes(PREMIUM_ENTITLEMENT)

  let nextTier: 'free' | 'premium' | null = null
  if (GRANT_EVENTS.has(event.type) && hasPremiumEntitlement) nextTier = 'premium'
  if (REVOKE_EVENTS.has(event.type) && hasPremiumEntitlement) nextTier = 'free'

  if (nextTier) {
    const { error } = await supabase
      .from('users')
      .update({ subscription_tier: nextTier, updated_at: new Date().toISOString() })
      .eq('id', userId)
    if (error) {
      console.error('revenuecat/webhook: failed to update user tier', error)
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
    }
  }

  await supabase.from('subscription_events').insert({
    user_id: userId,
    event_type: `revenuecat.${event.type}`,
    stripe_event_id: `rc_${event.id}`,
    data: {
      product_id: event.product_id,
      period_type: event.period_type,
      store: event.store,
      environment: event.environment,
      expiration_at_ms: event.expiration_at_ms,
      price: event.price,
      currency: event.currency,
      tier: nextTier,
    },
  })

  // Server-side purchase attribution for paid conversions (production only)
  if (
    event.environment === 'PRODUCTION' &&
    (event.type === 'INITIAL_PURCHASE' || event.type === 'RENEWAL') &&
    event.period_type !== 'TRIAL' &&
    typeof event.price === 'number' &&
    event.price > 0
  ) {
    try {
      const { data: user } = await supabase.from('users').select('email').eq('id', userId).single()
      await sendPurchaseEvent({
        email: user?.email || undefined,
        value: event.price,
        currency: (event.currency || 'USD').toUpperCase(),
        eventId: `rc_${event.id}`,
      })
    } catch (err) {
      console.error('revenuecat/webhook: meta purchase event failed', err)
    }
  }

  return NextResponse.json({ ok: true, tier: nextTier })
}
