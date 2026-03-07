import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*, user_profiles(*)')
      .eq('id', user.id)
      .single()

    if (userError) {
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: userData })
  } catch (error) {
    console.error('GET /api/user/profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      full_name,
      date_of_birth,
      menopause_stage,
      health_conditions,
      medications,
      lifestyle_factors,
      goals,
      onboarding_completed,
    } = body

    // Update users table fields
    const userUpdates: Record<string, unknown> = {}
    if (full_name !== undefined) userUpdates.full_name = full_name
    if (date_of_birth !== undefined) userUpdates.date_of_birth = date_of_birth
    if (menopause_stage !== undefined)
      userUpdates.menopause_stage = menopause_stage

    if (Object.keys(userUpdates).length > 0) {
      userUpdates.updated_at = new Date().toISOString()
      const { error: userError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', user.id)

      if (userError) {
        return NextResponse.json(
          { error: 'Failed to update user' },
          { status: 500 }
        )
      }
    }

    // Update user_profiles table fields
    const profileUpdates: Record<string, unknown> = {}
    if (health_conditions !== undefined)
      profileUpdates.health_conditions = health_conditions
    if (medications !== undefined) profileUpdates.medications = medications
    if (lifestyle_factors !== undefined)
      profileUpdates.lifestyle_factors = lifestyle_factors
    if (goals !== undefined) profileUpdates.goals = goals
    if (onboarding_completed !== undefined)
      profileUpdates.onboarding_completed = onboarding_completed

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({ user_id: user.id, ...profileUpdates })

      if (profileError) {
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        )
      }
    }

    // Return updated data
    const { data: updatedData } = await supabase
      .from('users')
      .select('*, user_profiles(*)')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ data: updatedData })
  } catch (error) {
    console.error('PUT /api/user/profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
