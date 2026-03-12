import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { streamChatResponse, type ChatMessage, type TokenUsage } from '@/lib/ai/claude'
import { buildAnonymousSystemPrompt } from '@/lib/ai/system-prompt'
import { randomUUID } from 'crypto'

// In-memory message store — ephemeral by design
const sessionMessages = new Map<string, ChatMessage[]>()
const sessionMessageCounts = new Map<string, number>()

const MAX_MESSAGES = 10
const MAX_HISTORY = 10

function getOrCreateSessionId(): string {
  const cookieStore = cookies()
  const existing = cookieStore.get('anonymous_session')?.value
  if (existing) return existing

  const sessionId = randomUUID()
  cookieStore.set('anonymous_session', sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
  return sessionId
}

export async function POST(request: Request) {
  try {
    const sessionId = getOrCreateSessionId()

    const body = await request.json()
    const { message, quizSymptoms, quizLevel } = body as {
      message: string
      quizSymptoms?: string[]
      quizLevel?: string
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Check message count
    const count = sessionMessageCounts.get(sessionId) || 0
    if (count >= MAX_MESSAGES) {
      return NextResponse.json(
        {
          error: "You've been great to talk to! Create a free account to keep our conversation going and unlock daily check-ins.",
          limitReached: true,
        },
        { status: 429 }
      )
    }

    // Get or init message history
    if (!sessionMessages.has(sessionId)) {
      sessionMessages.set(sessionId, [])
    }
    const history = sessionMessages.get(sessionId)!

    // Add user message
    history.push({ role: 'user', content: message.trim() })
    sessionMessageCounts.set(sessionId, count + 1)

    // Build system prompt
    const quizContext =
      quizSymptoms && quizSymptoms.length > 0
        ? { symptoms: quizSymptoms, level: quizLevel || 'unknown' }
        : undefined
    const systemPrompt = buildAnonymousSystemPrompt(quizContext)

    // Keep only last N messages for context
    const chatMessages: ChatMessage[] = history.slice(-MAX_HISTORY)

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
                `data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`
              )
            )
            result = await generator.next()
          }

          // Store assistant response in memory
          history.push({ role: 'assistant', content: fullResponse })

          const tokenUsage = result.value as TokenUsage | undefined
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'done',
                model: tokenUsage?.model,
                tier: tokenUsage?.tier,
                messageCount: (sessionMessageCounts.get(sessionId) || 0),
              })}\n\n`
            )
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

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('POST /api/chat/anonymous error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
