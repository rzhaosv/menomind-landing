import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PlanStatus } from '@/types/database'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const planId = params.id

    // Verify ownership
    const { data: existingPlan } = await supabase
      .from('wellness_plans')
      .select('id')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single()

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { status, content } = body as {
      status?: PlanStatus
      content?: Record<string, unknown>
    }

    const updates: Record<string, unknown> = {}
    if (status !== undefined) {
      const validStatuses: PlanStatus[] = ['active', 'completed', 'paused']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be active, completed, or paused' },
          { status: 400 }
        )
      }
      updates.status = status
    }
    if (content !== undefined) {
      updates.content = content
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('wellness_plans')
      .update(updates)
      .eq('id', planId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update plan' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('PUT /api/plans/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
