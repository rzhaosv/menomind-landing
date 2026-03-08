import { createClient } from '@/lib/supabase/server'

export async function getUserTier(userId: string): Promise<'free' | 'premium'> {
  const supabase = createClient()
  const { data } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', userId)
    .single()

  return (data?.subscription_tier as 'free' | 'premium') ?? 'free'
}

export async function checkMessageLimit(userId: string): Promise<{
  allowed: boolean
  used: number
  limit: number
}> {
  const supabase = createClient()

  // Check tier
  const { data: user } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', userId)
    .single()

  if (user?.subscription_tier === 'premium') {
    return { allowed: true, used: 0, limit: Infinity }
  }

  // Count today's messages for free users
  const today = new Date().toISOString().split('T')[0]

  // First get user's conversation IDs
  const { data: convos } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId)

  const convoIds = (convos || []).map((c) => c.id)

  let used = 0
  if (convoIds.length > 0) {
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'user')
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`)
      .in('conversation_id', convoIds)

    used = count ?? 0
  }
  const FREE_DAILY_LIMIT = 5

  return {
    allowed: used < FREE_DAILY_LIMIT,
    used,
    limit: FREE_DAILY_LIMIT,
  }
}

export function isPremiumFeature(feature: string): boolean {
  const premiumFeatures = [
    'unlimited_chat',
    'full_history',
    'correlation_analysis',
    'monthly_reports',
    'export_report',
    'all_wellness_plans',
    'weekly_insights',
    'conversation_history',
  ]
  return premiumFeatures.includes(feature)
}
