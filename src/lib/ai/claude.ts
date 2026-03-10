/**
 * MenoMind AI Client — Multi-model support
 * 
 * Supports routing to:
 * - Anthropic (Claude Haiku 4.5, Claude Sonnet 4.6)
 * - OpenAI (GPT-4.1 Nano) for structured data tasks
 * 
 * Drop-in replacement for src/lib/ai/claude.ts
 */

import Anthropic from '@anthropic-ai/sdk'
import { type ModelTier, getModelConfig, classifyMessage, classifyTask } from './model-router'

// ── Anthropic client ────────────────────────────────────────────────

let _anthropic: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured. Please add it to your environment variables.')
    }
    _anthropic = new Anthropic({ apiKey })
  }
  return _anthropic
}

// ── OpenAI client (lazy, only loaded if nano tier is used) ──────────

let _openaiModule: typeof import('openai') | null = null

async function getOpenAIClient() {
  if (!_openaiModule) {
    _openaiModule = await import('openai')
  }
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured. Falling back to Anthropic.')
  }
  return new _openaiModule.default({ apiKey })
}

// ── Types ───────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  model: string
  tier: ModelTier
}

// ── Streaming chat (Anthropic models only) ──────────────────────────


export async function* streamChatResponse(
  systemPrompt: string,
  messages: ChatMessage[],
  tierOverride?: ModelTier
): AsyncGenerator<string, TokenUsage | undefined, unknown> {
  // Classify the latest user message to pick the right model
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
  const tier = tierOverride ?? (lastUserMessage ? classifyMessage(lastUserMessage.content) : 'haiku')
  const config = getModelConfig(tier)

  if (config.provider === 'openai') {
    // OpenAI doesn't go through streaming path — fallback to haiku for chat
    // (nano is only used for structured tasks via generateStructured)
    const haikuConfig = getModelConfig('haiku')
    return yield* streamAnthropicChat(systemPrompt, messages, haikuConfig.model, haikuConfig.maxTokens, 'haiku')
  }

  return yield* streamAnthropicChat(systemPrompt, messages, config.model, config.maxTokens, tier)
}

async function* streamAnthropicChat(
  systemPrompt: string,
  messages: ChatMessage[],
  model: string,
  maxTokens: number,
  tier: ModelTier
): AsyncGenerator<string, TokenUsage | undefined, unknown> {
  const anthropic = getAnthropicClient()

  const stream = anthropic.messages.stream({
    model,
    max_tokens: maxTokens,

    system: systemPrompt,
    messages: messages.map(m => ({
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
    model,
    tier,

  }
}

// ── Non-streaming generation (plans, reports) ───────────────────────

export async function generatePlan(
  systemPrompt: string,
  userContext: string
): Promise<{ content: string; tokens: number; model: string; tier: ModelTier }> {
  const tier = classifyTask('plan_generation')
  const config = getModelConfig(tier)

  if (config.provider === 'openai') {
    return generateWithOpenAI(systemPrompt, userContext, config.model, config.maxTokens, tier)
  }

  return generateWithAnthropic(systemPrompt, userContext, config.model, config.maxTokens, tier)
}

/**
 * Generate structured output (JSON) for data tasks like symptom parsing,
 * report generation, trend summaries. Routes to cheapest model.
 */
export async function generateStructured(
  systemPrompt: string,
  userInput: string,
  task: 'symptom_parse' | 'report_generation' | 'trend_summary'
): Promise<{ content: string; tokens: number; model: string; tier: ModelTier }> {
  const tier = classifyTask(task)
  const config = getModelConfig(tier)

  if (config.provider === 'openai') {
    return generateWithOpenAI(systemPrompt, userInput, config.model, config.maxTokens, tier)
  }

  return generateWithAnthropic(systemPrompt, userInput, config.model, config.maxTokens, tier)
}

// ── Provider-specific generators ────────────────────────────────────

async function generateWithAnthropic(
  systemPrompt: string,
  userInput: string,
  model: string,
  maxTokens: number,
  tier: ModelTier
): Promise<{ content: string; tokens: number; model: string; tier: ModelTier }> {
  const anthropic = getAnthropicClient()

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,

    system: systemPrompt,
    messages: [{ role: 'user', content: userInput }],
  })

  const content = response.content[0].type === 'text' ? response.content[0].text : ''
  return {
    content,
    tokens: response.usage.input_tokens + response.usage.output_tokens,
    model,
    tier,
  }
}

async function generateWithOpenAI(
  systemPrompt: string,
  userInput: string,
  model: string,
  maxTokens: number,
  tier: ModelTier
): Promise<{ content: string; tokens: number; model: string; tier: ModelTier }> {
  try {
    const openai = await getOpenAIClient()

    const response = await openai.chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
    })

    const content = response.choices[0]?.message?.content ?? ''
    const tokens =
      (response.usage?.prompt_tokens ?? 0) + (response.usage?.completion_tokens ?? 0)

    return { content, tokens, model, tier }
  } catch (error) {
    // Fallback to Anthropic Haiku if OpenAI fails
    console.warn(`OpenAI (${model}) failed, falling back to Haiku:`, error)
    return generateWithAnthropic(systemPrompt, userInput, 'claude-haiku-4-5-20251001', maxTokens, 'haiku')
  }
}/**
 * MenoMind AI Client — Multi-model support
 * 
 * Supports routing to:
 * - Anthropic (Claude Haiku 4.5, Claude Sonnet 4.6)
 * - OpenAI (GPT-4.1 Nano) for structured data tasks
 * 
 * Drop-in replacement for src/lib/ai/claude.ts
 */

import Anthropic from '@anthropic-ai/sdk'
import { type ModelTier, getModelConfig, classifyMessage, classifyTask } from './model-router'

// ── Anthropic client ────────────────────────────────────────────────

let _anthropic: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured. Please add it to your environment variables.')
    }
    _anthropic = new Anthropic({ apiKey })
  }
  return _anthropic
}

// ── OpenAI client (lazy, only loaded if nano tier is used) ──────────

let _openaiModule: typeof import('openai') | null = null

async function getOpenAIClient() {
  if (!_openaiModule) {
    _openaiModule = await import('openai')
  }
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured. Falling back to Anthropic.')
  }
  return new _openaiModule.default({ apiKey })
}

// ── Types ───────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  model: string
  tier: ModelTier
}

// ── Streaming chat (Anthropic models only) ──────────────────────────


export async function* streamChatResponse(
  systemPrompt: string,
  messages: ChatMessage[],
  tierOverride?: ModelTier
): AsyncGenerator<string, TokenUsage | undefined, unknown> {
  // Classify the latest user message to pick the right model
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
  const tier = tierOverride ?? (lastUserMessage ? classifyMessage(lastUserMessage.content) : 'haiku')
  const config = getModelConfig(tier)

  if (config.provider === 'openai') {
    // OpenAI doesn't go through streaming path — fallback to haiku for chat
    // (nano is only used for structured tasks via generateStructured)
    const haikuConfig = getModelConfig('haiku')
    return yield* streamAnthropicChat(systemPrompt, messages, haikuConfig.model, haikuConfig.maxTokens, 'haiku')
  }

  return yield* streamAnthropicChat(systemPrompt, messages, config.model, config.maxTokens, tier)
}

async function* streamAnthropicChat(
  systemPrompt: string,
  messages: ChatMessage[],
  model: string,
  maxTokens: number,
  tier: ModelTier
): AsyncGenerator<string, TokenUsage | undefined, unknown> {
  const anthropic = getAnthropicClient()

  const stream = anthropic.messages.stream({
    model,
    max_tokens: maxTokens,

    system: systemPrompt,
    messages: messages.map(m => ({
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
    model,
    tier,

  }
}

// ── Non-streaming generation (plans, reports) ───────────────────────

export async function generatePlan(
  systemPrompt: string,
  userContext: string
): Promise<{ content: string; tokens: number; model: string; tier: ModelTier }> {
  const tier = classifyTask('plan_generation')
  const config = getModelConfig(tier)

  if (config.provider === 'openai') {
    return generateWithOpenAI(systemPrompt, userContext, config.model, config.maxTokens, tier)
  }

  return generateWithAnthropic(systemPrompt, userContext, config.model, config.maxTokens, tier)
}

/**
 * Generate structured output (JSON) for data tasks like symptom parsing,
 * report generation, trend summaries. Routes to cheapest model.
 */
export async function generateStructured(
  systemPrompt: string,
  userInput: string,
  task: 'symptom_parse' | 'report_generation' | 'trend_summary'
): Promise<{ content: string; tokens: number; model: string; tier: ModelTier }> {
  const tier = classifyTask(task)
  const config = getModelConfig(tier)

  if (config.provider === 'openai') {
    return generateWithOpenAI(systemPrompt, userInput, config.model, config.maxTokens, tier)
  }

  return generateWithAnthropic(systemPrompt, userInput, config.model, config.maxTokens, tier)
}

// ── Provider-specific generators ────────────────────────────────────

async function generateWithAnthropic(
  systemPrompt: string,
  userInput: string,
  model: string,
  maxTokens: number,
  tier: ModelTier
): Promise<{ content: string; tokens: number; model: string; tier: ModelTier }> {
  const anthropic = getAnthropicClient()

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,

    system: systemPrompt,
    messages: [{ role: 'user', content: userInput }],
  })

  const content = response.content[0].type === 'text' ? response.content[0].text : ''
  return {
    content,
    tokens: response.usage.input_tokens + response.usage.output_tokens,
    model,
    tier,
  }
}

async function generateWithOpenAI(
  systemPrompt: string,
  userInput: string,
  model: string,
  maxTokens: number,
  tier: ModelTier
): Promise<{ content: string; tokens: number; model: string; tier: ModelTier }> {
  try {
    const openai = await getOpenAIClient()

    const response = await openai.chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
    })

    const content = response.choices[0]?.message?.content ?? ''
    const tokens =
      (response.usage?.prompt_tokens ?? 0) + (response.usage?.completion_tokens ?? 0)

    return { content, tokens, model, tier }
  } catch (error) {
    // Fallback to Anthropic Haiku if OpenAI fails
    console.warn(`OpenAI (${model}) failed, falling back to Haiku:`, error)
    return generateWithAnthropic(systemPrompt, userInput, 'claude-haiku-4-5-20251001', maxTokens, 'haiku')
  }
}/**
 * MenoMind AI Client — Multi-model support
 * 
 * Supports routing to:
 * - Anthropic (Claude Haiku 4.5, Claude Sonnet 4.6)
 * - OpenAI (GPT-4.1 Nano) for structured data tasks
 * 
 * Drop-in replacement for src/lib/ai/claude.ts
 */

import Anthropic from '@anthropic-ai/sdk'
import { type ModelTier, getModelConfig, classifyMessage, classifyTask } from './model-router'

// ── Anthropic client ────────────────────────────────────────────────

let _anthropic: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured. Please add it to your environment variables.')
    }
    _anthropic = new Anthropic({ apiKey })
  }
  return _anthropic
}

// ── OpenAI client (lazy, only loaded if nano tier is used) ──────────

let _openaiModule: typeof import('openai') | null = null

async function getOpenAIClient() {
  if (!_openaiModule) {
    _openaiModule = await import('openai')
  }
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured. Falling back to Anthropic.')
  }
  return new _openaiModule.default({ apiKey })
}

// ── Types ───────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
<<<<<<< Updated upstream
  model?: string
  tier?: string
}

const CHAT_MODEL = 'claude-haiku-4-5-20251001'
=======
  model: string
  tier: ModelTier
}

// ── Streaming chat (Anthropic models only) ──────────────────────────
>>>>>>> Stashed changes

export async function* streamChatResponse(
  systemPrompt: string,
  messages: ChatMessage[],
  tierOverride?: ModelTier
): AsyncGenerator<string, TokenUsage | undefined, unknown> {
  // Classify the latest user message to pick the right model
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
  const tier = tierOverride ?? (lastUserMessage ? classifyMessage(lastUserMessage.content) : 'haiku')
  const config = getModelConfig(tier)

  if (config.provider === 'openai') {
    // OpenAI doesn't go through streaming path — fallback to haiku for chat
    // (nano is only used for structured tasks via generateStructured)
    const haikuConfig = getModelConfig('haiku')
    return yield* streamAnthropicChat(systemPrompt, messages, haikuConfig.model, haikuConfig.maxTokens, 'haiku')
  }

  return yield* streamAnthropicChat(systemPrompt, messages, config.model, config.maxTokens, tier)
}

async function* streamAnthropicChat(
  systemPrompt: string,
  messages: ChatMessage[],
  model: string,
  maxTokens: number,
  tier: ModelTier
): AsyncGenerator<string, TokenUsage | undefined, unknown> {
  const anthropic = getAnthropicClient()

  const stream = anthropic.messages.stream({
<<<<<<< Updated upstream
    model: CHAT_MODEL,
    max_tokens: 4000,
=======
    model,
    max_tokens: maxTokens,
>>>>>>> Stashed changes
    system: systemPrompt,
    messages: messages.map(m => ({
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
<<<<<<< Updated upstream
    model: CHAT_MODEL,
    tier: 'free',
=======
    model,
    tier,
>>>>>>> Stashed changes
  }
}

// ── Non-streaming generation (plans, reports) ───────────────────────

export async function generatePlan(
  systemPrompt: string,
  userContext: string
): Promise<{ content: string; tokens: number; model: string; tier: ModelTier }> {
  const tier = classifyTask('plan_generation')
  const config = getModelConfig(tier)

  if (config.provider === 'openai') {
    return generateWithOpenAI(systemPrompt, userContext, config.model, config.maxTokens, tier)
  }

  return generateWithAnthropic(systemPrompt, userContext, config.model, config.maxTokens, tier)
}

/**
 * Generate structured output (JSON) for data tasks like symptom parsing,
 * report generation, trend summaries. Routes to cheapest model.
 */
export async function generateStructured(
  systemPrompt: string,
  userInput: string,
  task: 'symptom_parse' | 'report_generation' | 'trend_summary'
): Promise<{ content: string; tokens: number; model: string; tier: ModelTier }> {
  const tier = classifyTask(task)
  const config = getModelConfig(tier)

  if (config.provider === 'openai') {
    return generateWithOpenAI(systemPrompt, userInput, config.model, config.maxTokens, tier)
  }

  return generateWithAnthropic(systemPrompt, userInput, config.model, config.maxTokens, tier)
}

// ── Provider-specific generators ────────────────────────────────────

async function generateWithAnthropic(
  systemPrompt: string,
  userInput: string,
  model: string,
  maxTokens: number,
  tier: ModelTier
): Promise<{ content: string; tokens: number; model: string; tier: ModelTier }> {
  const anthropic = getAnthropicClient()

  const response = await anthropic.messages.create({
<<<<<<< Updated upstream
    model: CHAT_MODEL,
    max_tokens: 4000,
=======
    model,
    max_tokens: maxTokens,
>>>>>>> Stashed changes
    system: systemPrompt,
    messages: [{ role: 'user', content: userInput }],
  })

  const content = response.content[0].type === 'text' ? response.content[0].text : ''
  return {
    content,
    tokens: response.usage.input_tokens + response.usage.output_tokens,
    model,
    tier,
  }
}

async function generateWithOpenAI(
  systemPrompt: string,
  userInput: string,
  model: string,
  maxTokens: number,
  tier: ModelTier
): Promise<{ content: string; tokens: number; model: string; tier: ModelTier }> {
  try {
    const openai = await getOpenAIClient()

    const response = await openai.chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
    })

    const content = response.choices[0]?.message?.content ?? ''
    const tokens =
      (response.usage?.prompt_tokens ?? 0) + (response.usage?.completion_tokens ?? 0)

    return { content, tokens, model, tier }
  } catch (error) {
    // Fallback to Anthropic Haiku if OpenAI fails
    console.warn(`OpenAI (${model}) failed, falling back to Haiku:`, error)
    return generateWithAnthropic(systemPrompt, userInput, 'claude-haiku-4-5-20251001', maxTokens, 'haiku')
  }
}
