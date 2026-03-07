import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamChatResponse, type ChatMessage } from '@/lib/ai/claude'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import { checkMessageLimit } from '@/lib/subscription/tier'
import type { User, UserProfile, SymptomLog } from '@/types/database'

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
    const { conversationId, message } = body as {
      conversationId?: string
      message: string
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Check message limits for free users
    const limitCheck = await checkMessageLimit(authUser.id)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Daily message limit reached',
          used: limitCheck.used,
          limit: limitCheck.limit,
        },
        { status: 429 }
      )
    }

    // Get or create conversation
    let activeConversationId = conversationId

    if (!activeConversationId) {
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: authUser.id,
          title: message.slice(0, 100),
        })
        .select()
        .single()

      if (convError || !newConversation) {
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        )
      }

      activeConversationId = newConversation.id
    } else {
      // Verify conversation ownership
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', activeConversationId)
        .eq('user_id', authUser.id)
        .single()

      if (!existingConv) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        )
      }
    }

    // Save user message to DB
    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: activeConversationId,
      role: 'user',
      content: message.trim(),
    })

    if (msgError) {
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      )
    }

    // Fetch user context for system prompt
    const [userResult, profileResult, symptomsResult, messagesResult] =
      await Promise.all([
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
          .limit(7),
        supabase
          .from('messages')
          .select('role, content')
          .eq('conversation_id', activeConversationId)
          .order('created_at', { ascending: true })
          .limit(10),
      ])

    const userData = userResult.data as User | null
    const profileData = profileResult.data as UserProfile | null
    const recentSymptoms = (symptomsResult.data || []) as SymptomLog[]

    const systemPrompt = buildSystemPrompt(userData, profileData, recentSymptoms)

    // Build message history for context
    const chatMessages: ChatMessage[] = (messagesResult.data || []).map(
      (m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })
    )

    // Stream response
    const encoder = new TextEncoder()
    let fullResponse = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = streamChatResponse(systemPrompt, chatMessages)
          let result = await generator.next()

          while (!result.done) {
            const chunk = result.value
            fullResponse += chunk
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'chunk', content: chunk, conversationId: activeConversationId })}\n\n`
              )
            )
            result = await generator.next()
          }

          // Save assistant response to DB
          await supabase.from('messages').insert({
            conversation_id: activeConversationId,
            role: 'assistant',
            content: fullResponse,
            tokens_used: result.value
              ? (result.value as { inputTokens: number; outputTokens: number })
                  .inputTokens +
                (result.value as { inputTokens: number; outputTokens: number })
                  .outputTokens
              : null,
          })

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'done', conversationId: activeConversationId })}\n\n`
            )
          )
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', error: 'Failed to generate response' })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('POST /api/chat/message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
