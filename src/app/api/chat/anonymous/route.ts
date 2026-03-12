import { NextResponse } from 'next/server'
import { streamChatResponse, type ChatMessage, type TokenUsage } from '@/lib/ai/claude'
import { buildAnonymousSystemPrompt } from '@/lib/ai/system-prompt'
import { MAX_TOKENS_BY_SUBSCRIPTION } from '@/lib/ai/model-router'
import { randomUUID } from 'crypto'

// In-memory message store — ephemeral by design
const sessionMessages = new Map<string, ChatMessage[]>()
const sessionMessageCounts = new Map<string, number>()

const MAX_HISTORY = 10

function getSessionIdFromRequest(request: Request): { sessionId: string; isNew: boolean } {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/anonymous_session=([^;]+)/)
  if (match) return { sessionId: match[1], isNew: false }
  return { sessionId: randomUUID(), isNew: true }
}

export async function POST(request: Request) {
  try {
    const { sessionId, isNew } = getSessionIdFromRequest(request)

    const body = await request.json()
    const { message, quizSymptoms, quizLevel } = body as {
      message: string
      quizSymptoms?: string[]
      quizLevel?: string
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Track message count (no hard limit — conversation flows freely)
    const count = (sessionMessageCounts.get(sessionId) || 0) + 1
    sessionMessageCounts.set(sessionId, count)

    // Get or init message history
    if (!sessionMessages.has(sessionId)) {
      sessionMessages.set(sessionId, [])
    }
    const history = sessionMessages.get(sessionId)!

    // Add user message
    history.push({ role: 'user', content: message.trim() })

    // Build system prompt
    const quizContext =
      quizSymptoms && quizSymptoms.length > 0
        ? { symptoms: quizSymptoms, level: quizLevel || 'unknown' }
        : undefined
    const systemPrompt = buildAnonymousSystemPrompt(quizContext, count)

    // Keep only last N messages for context
    const chatMessages: ChatMessage[] = history.slice(-MAX_HISTORY)

    // Always use haiku for anonymous users (cost optimization)
    const tierOverride = 'haiku' as const

    // Stream response
    const encoder = new TextEncoder()
    let fullResponse = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = streamChatResponse(systemPrompt, chatMessages, tierOverride, MAX_TOKENS_BY_SUBSCRIPTION.anonymous)
          let result = await generator.next()

          while (!result.done) {
            const chunk = result.value
            fullResponse += chunk
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`
              )
            )
            result = await generator.next()
          }

          // Store assistant response in memory
          history.push({ role: 'assistant', content: fullResponse })

          const tokenUsage = result.value as TokenUsage | undefined
          // Strip [UPGRADE_CTA] marker from visible response, use it as signal
          const hasUpgradeCta = fullResponse.includes('[UPGRADE_CTA]')
          if (hasUpgradeCta) {
            fullResponse = fullResponse.replace(/\s*\[UPGRADE_CTA\]\s*/g, '')
            // Update the stored response without the marker
            history[history.length - 1] = { role: 'assistant', content: fullResponse }
          }

          const phase = count <= 3 ? 'free' : 'conversion'
          const donePayload: Record<string, unknown> = {
            type: 'done',
            model: tokenUsage?.model,
            tier: tokenUsage?.tier,
            messageCount: count,
            phase,
            showTrialOffer: hasUpgradeCta || (phase === 'conversion' && count >= 5),
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(donePayload)}\n\n`)
          )
          controller.close()
        } catch (error) {
          console.error('Anonymous streaming error:', error)
          const errMsg = error instanceof Error ? error.message : 'Unknown error'
          let userMessage = 'Something went wrong. Please try again.'
          if (errMsg.includes('ANTHROPIC_API_KEY')) {
            userMessage = 'AI service is not configured. Please try again later.'
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

    const headers: Record<string, string> = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    }
    if (isNew) {
      headers['Set-Cookie'] = `anonymous_session=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    }

    return new Response(stream, { headers })
  } catch (error) {
    console.error('POST /api/chat/anonymous error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
