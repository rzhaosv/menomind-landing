export type MenopauseStage = 'pre' | 'peri' | 'post' | 'unsure'
export type SubscriptionTier = 'free' | 'premium'
export type MessageRole = 'user' | 'assistant'
export type PlanType = 'nutrition' | 'exercise' | 'sleep' | 'stress' | 'supplement'
export type PlanStatus = 'active' | 'completed' | 'paused'

export interface User {
  id: string
  email: string
  full_name: string | null
  date_of_birth: string | null
  menopause_stage: MenopauseStage | null
  subscription_tier: SubscriptionTier
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

export interface UserProfile {
  user_id: string
  health_conditions: Record<string, unknown> | null
  medications: Record<string, unknown> | null
  lifestyle_factors: Record<string, unknown> | null
  goals: string[] | null
  onboarding_completed: boolean
}

export interface SymptomLog {
  id: string
  user_id: string
  date: string
  symptoms: Record<string, number>
  notes: string | null
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string | null
  summary: string | null
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: MessageRole
  content: string
  tokens_used: number | null
  cost_usd: number | null
  created_at: string
}

export interface WellnessPlan {
  id: string
  user_id: string
  plan_type: PlanType
  content: Record<string, unknown>
  status: PlanStatus
  created_at: string
}

export interface SubscriptionEvent {
  id: string
  user_id: string
  event_type: string
  stripe_event_id: string
  data: Record<string, unknown>
  created_at: string
}

export interface SymptomEntry {
  hot_flashes: number
  night_sweats: number
  sleep_quality: number
  mood: number
  energy: number
  brain_fog: number
  joint_pain: number
  weight_changes: number
  menstrual_cycle: number
  libido: number
}
