import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE() {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const userId = user.id

    // Delete all user data from all tables (order matters for foreign keys)
    // Delete messages via conversations
    const { data: conversations } = await adminClient
      .from('conversations')
      .select('id')
      .eq('user_id', userId)

    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map((c) => c.id)
      await adminClient
        .from('messages')
        .delete()
        .in('conversation_id', conversationIds)
    }

    // Delete from all user-related tables
    await adminClient
      .from('conversations')
      .delete()
      .eq('user_id', userId)

    await adminClient
      .from('wellness_plans')
      .delete()
      .eq('user_id', userId)

    await adminClient
      .from('symptom_logs')
      .delete()
      .eq('user_id', userId)

    await adminClient
      .from('subscription_events')
      .delete()
      .eq('user_id', userId)

    await adminClient
      .from('user_profiles')
      .delete()
      .eq('user_id', userId)

    await adminClient.from('users').delete().eq('id', userId)

    // Delete auth user
    const { error: deleteAuthError } =
      await adminClient.auth.admin.deleteUser(userId)

    if (deleteAuthError) {
      console.error('Failed to delete auth user:', deleteAuthError)
      return NextResponse.json(
        { error: 'Failed to delete auth account' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Account deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/user/account error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
