import Anthropic from '@anthropic-ai/sdk'

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured. Please add it to your environment variables.')
  }
  return new Anthropic({ apiKey })
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
}

export async function* streamChatResponse(
  systemPrompt: string,
  messages: ChatMessage[]
) {
  const anthropic = getClient()
  const stream = anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  })

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text
    }
  }

  const finalMessage = await stream.finalMessage()
  return {
    inputTokens: finalMessage.usage.input_tokens,
    outputTokens: finalMessage.usage.output_tokens,
  }
}

export async function generatePlan(
  systemPrompt: string,
  userContext: string
): Promise<{ content: string; tokens: number }> {
  const anthropic = getClient()
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContext }],
  })

  const content =
    response.content[0].type === 'text' ? response.content[0].text : ''
  return {
    content,
    tokens: response.usage.input_tokens + response.usage.output_tokens,
  }
}
