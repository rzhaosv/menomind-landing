import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const ALLOWED = new Set([
  'app_open', 'quiz_start', 'quiz_step', 'quiz_complete', 'quiz_email_submitted', 'quiz_email_skipped',
  'signup_view', 'signup_success', 'login_success', 'apple_signin_success',
  'paywall_view', 'paywall_plan_selected', 'purchase_start', 'purchase_success', 'purchase_cancelled', 'purchase_error',
  'restore_success', 'restore_empty', 'paywall_skip', 'upgrade_prompt_tap',
  'symptom_logged', 'chat_message_sent', 'plan_generated', 'plan_viewed', 'review_prompt_shown', 'account_deleted', 'signout',
])
const MAX_BATCH = 50

interface IncomingEvent { event: string; props?: Record<string, unknown>; ts?: number }

/**
 * First-party product analytics for the mobile app. Accepts a batch of events;
 * attributes to the Supabase user when a Bearer token is present, else to anon_id.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { events?: IncomingEvent[]; anon_id?: string; platform?: string; app_version?: string }
    const events = (body.events ?? []).slice(0, MAX_BATCH).filter((e) => e && ALLOWED.has(e.event))
    if (events.length === 0) return NextResponse.json({ ok: true, accepted: 0 })

    let userId: string | null = null
    if (request.headers.get('authorization')?.startsWith('Bearer ')) {
      const { data } = await createClient().auth.getUser()
      userId = data.user?.id ?? null
    }
    const anonId = typeof body.anon_id === 'string' ? body.anon_id.slice(0, 64) : null

    const rows = events.map((e) => ({
      user_id: userId,
      anon_id: anonId,
      event: e.event,
      props: e.props && typeof e.props === 'object' ? e.props : null,
      platform: typeof body.platform === 'string' ? body.platform.slice(0, 16) : null,
      app_version: typeof body.app_version === 'string' ? body.app_version.slice(0, 16) : null,
      created_at: e.ts && Number.isFinite(e.ts) ? new Date(e.ts).toISOString() : new Date().toISOString(),
    }))

    const { error } = await createAdminClient().from('app_events').insert(rows)
    if (error) {
      console.error('POST /api/events insert failed', error)
      return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, accepted: rows.length })
  } catch (error) {
    console.error('POST /api/events error:', error)
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
