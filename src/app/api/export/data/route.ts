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

    // Fetch all user data from all tables
    const [
      userResult,
      profileResult,
      symptomLogsResult,
      conversationsResult,
      wellnessPlansResult,
    ] = await Promise.all([
      supabase.from('users').select('*').eq('id', user.id).single(),
      supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('symptom_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false }),
      supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('wellness_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ])

    // Fetch messages for each conversation
    const conversations = conversationsResult.data || []
    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conv) => {
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: true })

        return {
          ...conv,
          messages: messages || [],
        }
      })
    )

    const exportData = {
      exported_at: new Date().toISOString(),
      user: userResult.data,
      profile: profileResult.data,
      symptom_logs: symptomLogsResult.data || [],
      conversations: conversationsWithMessages,
      wellness_plans: wellnessPlansResult.data || [],
    }

    const jsonString = JSON.stringify(exportData, null, 2)

    return new Response(jsonString, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="menomind-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('GET /api/export/data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
