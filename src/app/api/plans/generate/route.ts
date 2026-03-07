import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePlan } from '@/lib/ai/claude'
import { buildPlanGenerationPrompt } from '@/lib/ai/system-prompt'
import { getUserTier } from '@/lib/subscription/tier'
import type { PlanType, User, UserProfile, SymptomLog } from '@/types/database'

const VALID_PLAN_TYPES: PlanType[] = [
  'nutrition',
  'exercise',
  'sleep',
  'stress',
  'supplement',
]

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planType } = body as { planType: PlanType }

    if (!planType || !VALID_PLAN_TYPES.includes(planType)) {
      return NextResponse.json(
        {
          error: `Invalid plan type. Must be one of: ${VALID_PLAN_TYPES.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Check tier limits - free users can only have 1 plan total
    const tier = await getUserTier(authUser.id)

    if (tier === 'free') {
      const { count } = await supabase
        .from('wellness_plans')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', authUser.id)
        .eq('status', 'active')

      if ((count ?? 0) >= 1) {
        // Check if the existing plan is of a different type
        const { data: existingPlan } = await supabase
          .from('wellness_plans')
          .select('id, plan_type')
          .eq('user_id', authUser.id)
          .eq('status', 'active')
          .single()

        if (existingPlan && existingPlan.plan_type !== planType) {
          return NextResponse.json(
            {
              error:
                'Free users can only have 1 active plan. Upgrade to premium for unlimited plans.',
            },
            { status: 403 }
          )
        }
      }
    }

    // Fetch user context for plan generation
    const [userResult, profileResult, symptomsResult] = await Promise.all([
      supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single(),
      supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single(),
      supabase
        .from('symptom_logs')
        .select('*')
        .eq('user_id', authUser.id)
        .order('date', { ascending: false })
        .limit(14),
    ])

    const userData = userResult.data as User | null
    const profileData = profileResult.data as UserProfile | null
    const recentSymptoms = (symptomsResult.data || []) as SymptomLog[]

    // Build user context string for plan generation
    let userContext = ''
    if (userData) {
      const age = userData.date_of_birth
        ? Math.floor(
            (Date.now() - new Date(userData.date_of_birth).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000)
          )
        : null
      userContext += `User: ${userData.full_name || 'Unknown'}, Age: ${age || 'Unknown'}, Stage: ${userData.menopause_stage || 'Unknown'}\n`
    }

    if (profileData) {
      if (profileData.health_conditions) {
        userContext += `Health Conditions: ${JSON.stringify(profileData.health_conditions)}\n`
      }
      if (profileData.medications) {
        userContext += `Medications: ${JSON.stringify(profileData.medications)}\n`
      }
      if (profileData.lifestyle_factors) {
        userContext += `Lifestyle: ${JSON.stringify(profileData.lifestyle_factors)}\n`
      }
      if (profileData.goals?.length) {
        userContext += `Goals: ${profileData.goals.join(', ')}\n`
      }
    }

    if (recentSymptoms.length > 0) {
      userContext += `\nRecent Symptoms (last ${recentSymptoms.length} entries):\n`
      for (const log of recentSymptoms.slice(0, 5)) {
        userContext += `${log.date}: ${JSON.stringify(log.symptoms)}\n`
      }
    }

    const systemPrompt = buildPlanGenerationPrompt(planType)
    const { content, tokens } = await generatePlan(systemPrompt, userContext)

    // Parse the generated plan content
    let planContent: Record<string, unknown>
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      planContent = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content }
    } catch {
      planContent = { raw: content }
    }

    // Check if user already has a plan of this type and update it
    const { data: existingPlan } = await supabase
      .from('wellness_plans')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('plan_type', planType)
      .eq('status', 'active')
      .single()

    let data
    if (existingPlan) {
      const { data: updated, error } = await supabase
        .from('wellness_plans')
        .update({
          content: planContent,
          created_at: new Date().toISOString(),
        })
        .eq('id', existingPlan.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json(
          { error: 'Failed to update plan' },
          { status: 500 }
        )
      }
      data = updated
    } else {
      const { data: created, error } = await supabase
        .from('wellness_plans')
        .insert({
          user_id: authUser.id,
          plan_type: planType,
          content: planContent,
          status: 'active',
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json(
          { error: 'Failed to create plan' },
          { status: 500 }
        )
      }
      data = created
    }

    return NextResponse.json({ data, tokens })
  } catch (error) {
    console.error('POST /api/plans/generate error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
