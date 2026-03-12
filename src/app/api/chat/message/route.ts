import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamChatResponse, type ChatMessage, type TokenUsage } from '@/lib/ai/claude'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import { getUserTier, getChatMode } from '@/lib/subscription/tier'
import { MAX_TOKENS_BY_SUBSCRIPTION, estimateCost } from '@/lib/ai/model-router'
import {
  isInterpretationRequest,
  countUpgradePrompts,
  MAX_UPGRADE_PROMPTS_PER_CONVERSATION,
  UPGRADE_CTA_MARKER,
} from '@/lib/ai/conversion-triggers'
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

    // Get user tier — no daily limits, just feature gating
    const tier = await getUserTier(authUser.id)
    const chatMode = getChatMode(tier)

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

    // Check if we should trigger upgrade prompt for free users
    const existingMessages = messagesResult.data || []
    const assistantMessages = existingMessages
      .filter((m) => m.role === 'assistant')
      .map((m) => m.content)

    let shouldSuggestUpgrade = false
    if (chatMode === 'recognition') {
      const upgradeCount = countUpgradePrompts(assistantMessages)
      if (
        upgradeCount < MAX_UPGRADE_PROMPTS_PER_CONVERSATION &&
        isInterpretationRequest(message)
      ) {
        shouldSuggestUpgrade = true
      }
    }

    const systemPrompt = buildSystemPrompt(
      userData,
      profileData,
      recentSymptoms,
      chatMode
    )

    // Build message history for context
    const chatMessages: ChatMessage[] = existingMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // For free tier: force haiku + cap response length for cost optimization
    const tierOverride = chatMode === 'recognition' ? 'haiku' as const : undefined
    const maxTokens = MAX_TOKENS_BY_SUBSCRIPTION[tier] ?? MAX_TOKENS_BY_SUBSCRIPTION.free

    // Stream response
    const encoder = new TextEncoder()
    let fullResponse = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = streamChatResponse(systemPrompt, chatMessages, tierOverride, maxTokens)
          let result = await generator.next()

          while (!result.done) {
            const chunk = result.value
            fullResponse += chunk

            // Strip the upgrade marker from streamed output
            const cleanChunk = chunk.replace(UPGRADE_CTA_MARKER, '')
            if (cleanChunk) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'chunk', content: cleanChunk, conversationId: activeConversationId })}\n\n`
                )
              )
            }
            result = await generator.next()
          }

          // Check if AI included upgrade CTA
          const hasUpgradeCTA = fullResponse.includes(UPGRADE_CTA_MARKER)

          // Save assistant response to DB (keep marker for counting)
          const tokenUsage = result.value as TokenUsage | undefined
          const costUsd = tokenUsage
            ? estimateCost(tokenUsage.tier, tokenUsage.inputTokens, tokenUsage.outputTokens)
            : null
          await supabase.from('messages').insert({
            conversation_id: activeConversationId,
            role: 'assistant',
            content: fullResponse.trim(),
            tokens_used: tokenUsage
              ? tokenUsage.inputTokens + tokenUsage.outputTokens
              : null,
            cost_usd: costUsd,
          })

          // Send upgrade signal to frontend if relevant
          const donePayload: Record<string, unknown> = {
            type: 'done',
            conversationId: activeConversationId,
            model: tokenUsage?.model,
            tier: tokenUsage?.tier,
          }

          if (hasUpgradeCTA || shouldSuggestUpgrade) {
            donePayload.showUpgrade = true
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(donePayload)}\n\n`)
          )
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          const errMsg = error instanceof Error ? error.message : 'Unknown error'
          let userMessage = 'Something went wrong. Please try again.'
          if (errMsg.includes('ANTHROPIC_API_KEY')) {
            userMessage = 'AI service is not configured. Please contact support.'
          } else if (errMsg.includes('credit balance') || errMsg.includes('billing') || errMsg.includes('payment')) {
            userMessage = 'AI service is temporarily unavailable. Please try again later.'
          } else if (errMsg.includes('401') || errMsg.includes('authentication') || errMsg.includes('invalid.*api.*key')) {
            userMessage = 'AI service is not configured. Please contact support.'
          } else if (errMsg.includes('rate limit') || errMsg.includes('429')) {
            userMessage = 'Too many requests. Please wait a moment and try again.'
          }
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', error: userMessage })}\n\n`
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
    const message = error instanceof Error ? error.message : 'Internal server error'
    const isConfig = message.includes('ANTHROPIC_API_KEY')
    return NextResponse.json(
      { error: isConfig ? 'AI service is not configured. Please contact support.' : 'Something went wrong. Please try again.' },
      { status: isConfig ? 503 : 500 }
    )
  }
}
