import { createClient } from '@/lib/supabase/server'

export type SubscriptionTier = 'free' | 'premium'
export type ChatMode = 'recognition' | 'full'

export type Feature =
  | 'chat'
  | 'interpretation'
  | 'symptom_logging'
  | 'trend_view'
  | 'wellness_plans'
  | 'doctor_reports'
  | 'weekly_insights'
  | 'data_export'
  | 'conversation_history'
  | 'correlation_analysis'

export interface FeatureAccess {
  allowed: boolean
  chatMode: ChatMode
  trendDays: number | 'unlimited'
  maxWellnessPlans: number | 'unlimited'
}

const FEATURE_ACCESS: Record<SubscriptionTier, Record<Feature, boolean>> = {
  free: {
    chat: true,              // unlimited conversation
    interpretation: false,   // gated — the paywall boundary
    symptom_logging: true,
    trend_view: true,        // limited to 7 days
    wellness_plans: false,
    doctor_reports: false,
    weekly_insights: false,
    data_export: false,
    conversation_history: false,
    correlation_analysis: false,
  },
  premium: {
    chat: true,
    interpretation: true,
    symptom_logging: true,
    trend_view: true,
    wellness_plans: true,
    doctor_reports: true,
    weekly_insights: true,
    data_export: true,
    conversation_history: true,
    correlation_analysis: true,
  },
}

export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const supabase = createClient()
  const { data } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', userId)
    .single()

  return (data?.subscription_tier as SubscriptionTier) ?? 'free'
}

export function checkFeatureAccess(
  tier: SubscriptionTier,
  feature: Feature
): boolean {
  return FEATURE_ACCESS[tier]?.[feature] ?? false
}

export function getChatMode(tier: SubscriptionTier): ChatMode {
  return tier === 'premium' ? 'full' : 'recognition'
}

export function getTrendDays(tier: SubscriptionTier): number | 'unlimited' {
  return tier === 'premium' ? 'unlimited' : 7
}

export function getMaxWellnessPlans(tier: SubscriptionTier): number {
  return tier === 'premium' ? 5 : 0
}

export function isPremiumFeature(feature: string): boolean {
  const tier: SubscriptionTier = 'free'
  return !FEATURE_ACCESS[tier]?.[feature as Feature]
}

// Legacy compat — no longer enforces daily limits, just returns unlimited
export async function checkMessageLimit(userId: string): Promise<{
  allowed: boolean
  used: number
  limit: number
}> {
  return { allowed: true, used: 0, limit: Infinity }
}
