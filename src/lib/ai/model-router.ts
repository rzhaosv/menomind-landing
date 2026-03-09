/**
 * MenoMind Model Router
 * 
 * Routes messages to the appropriate AI model based on complexity:
 * - Claude Haiku 4.5: Daily chat, simple Q&A, emotional support (~75% of traffic)
 * - Claude Sonnet 4.6: Complex medical questions, drug interactions, lab interpretation (~10%)
 * - GPT-4.1 Nano (via OpenAI): Structured data tasks, symptom parsing, report generation (~15%)
 * 
 * Cost optimization: ~$15-40/mo at 1,000 users doing 15 msgs/day
 */

export type ModelTier = 'haiku' | 'sonnet' | 'nano'

export interface ModelConfig {
  provider: 'anthropic' | 'openai'
  model: string
  maxTokens: number
  tier: ModelTier
  costPer1MInput: number
  costPer1MOutput: number
}

export const MODEL_CONFIGS: Record<ModelTier, ModelConfig> = {
  haiku: {
    provider: 'anthropic',
    model: 'claude-haiku-4-5-20251001',
    maxTokens: 4000,
    tier: 'haiku',
    costPer1MInput: 0.25,
    costPer1MOutput: 1.25,
  },
  sonnet: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-6-20250514',
    maxTokens: 4000,
    tier: 'sonnet',
    costPer1MInput: 3.0,
    costPer1MOutput: 15.0,
  },
  nano: {
    provider: 'openai',
    model: 'gpt-4.1-nano',
    maxTokens: 4000,
    tier: 'nano',
    costPer1MInput: 0.10,
    costPer1MOutput: 0.40,
  },
}

/**
 * Keywords and patterns that indicate a message needs the more capable Sonnet model.
 * These are medical/clinical questions where accuracy matters most.
 */
const SONNET_PATTERNS: RegExp[] = [
  // Drug interactions and medications
  /\b(interact|interaction|contraindic|drug.{0,10}(with|and|plus)|combin(e|ing|ation).{0,15}(medication|drug|supplement|hrt|hormone))\b/i,
  // Lab results and interpretation
  /\b(lab\s*(result|work|test|value)|blood\s*(test|work|panel)|hormone\s*(level|panel|test)|fsh|estradiol|progesterone\s+level|thyroid\s+(panel|test|level)|tsh\b)/i,
  // HRT deep-dive questions
  /\b(hrt|hormone\s+replacement|bioidentical|estrogen\s+(patch|cream|pill|therapy)|progester(one|in)\s+(cream|pill|dose)|testosterone\s+(therapy|cream|pellet))\b.*\b(dose|dosage|switch|chang|risk|side\s+effect|cancer|blood\s+clot|stroke|heart|liver)\b/i,
  // Specific medical conditions + menopause intersection
  /\b(endometri|fibroid|pcos|polycystic|thyroid|autoimmune|diabetes|cardiovascular|osteopor|breast\s+cancer)\b.*\b(menopause|perimenopause|hrt|hormone|estrogen)\b/i,
  // "Should I" + medical decision
  /\bshould\s+i\b.*\b(take|start|stop|switch|increase|decrease|ask\s+(my\s+)?doctor)\b.*\b(medication|supplement|hrt|hormone|estrogen|progester|antidepressant|ssri|snri)\b/i,
  // Interpreting symptoms as potentially serious
  /\b(chest\s+pain|heart\s+palpitation|unusual\s+bleeding|heavy\s+bleeding|blood\s+clot|stroke\s+symptom|emergency|urgent|dangerous|alarming|worr(ied|ying)\s+about)\b/i,
  // Complex multi-symptom analysis
  /\b(multiple|several|many|combination|cluster|pattern)\b.*\b(symptom|sign)\b.*\b(mean|indicate|suggest|cause|relat|connect)\b/i,
]

/**
 * Keywords that indicate the message is simple chitchat, greetings, or emotional support.
 * These always go to Haiku (cheapest capable model).
 */
const HAIKU_FAST_PATTERNS: RegExp[] = [
  /^(hi|hey|hello|good\s+(morning|afternoon|evening)|thanks|thank\s+you|ok|okay|got\s+it|makes\s+sense)/i,
  /^(how\s+are\s+you|what('s|\s+is)\s+up)/i,
  /\b(feeling\s+(sad|lonely|frustrated|overwhelmed|anxious|stressed|down|tired|exhausted))\b/i,
  /\b(just\s+(need|want)\s+to\s+(talk|vent|chat))\b/i,
  /\b(can('t|not)\s+sleep|woke\s+up|bad\s+(day|night|morning))\b/i,
]

/**
 * Classify a user message to determine which model tier should handle it.
 * 
 * Priority:
 * 1. If message matches SONNET_PATTERNS → sonnet (complex medical)
 * 2. If message matches HAIKU_FAST_PATTERNS → haiku (simple/emotional)
 * 3. Default → haiku (safe, warm, good enough for most questions)
 */
export function classifyMessage(message: string): ModelTier {
  const trimmed = message.trim()
  
  // Very short messages are always simple
  if (trimmed.length < 15) return 'haiku'

  // Check for complex medical patterns first (escalate to Sonnet)
  for (const pattern of SONNET_PATTERNS) {
    if (pattern.test(trimmed)) return 'sonnet'
  }

  // Check for simple/emotional patterns (keep on Haiku)  
  for (const pattern of HAIKU_FAST_PATTERNS) {
    if (pattern.test(trimmed)) return 'haiku'
  }

  // Default: Haiku handles everything else well
  return 'haiku'
}

/**
 * Classify a task type for non-chat operations (plans, reports, parsing).
 * These structured-output tasks go to the cheapest model.
 */
export function classifyTask(
  task: 'plan_generation' | 'symptom_parse' | 'report_generation' | 'trend_summary'
): ModelTier {
  // All structured data tasks go to nano (cheapest)
  // except plan generation which benefits from Haiku's better instruction following
  switch (task) {
    case 'plan_generation':
      return 'haiku' // needs good instruction following for JSON output
    case 'symptom_parse':
    case 'report_generation':
    case 'trend_summary':
      return 'nano'
    default:
      return 'haiku'
  }
}

/**
 * Get the model config for a given tier.
 */
export function getModelConfig(tier: ModelTier): ModelConfig {
  return MODEL_CONFIGS[tier]
}

/**
 * Estimate cost for a single request in USD.
 */
export function estimateCost(
  tier: ModelTier,
  inputTokens: number,
  outputTokens: number
): number {
  const config = MODEL_CONFIGS[tier]
  return (
    (inputTokens / 1_000_000) * config.costPer1MInput +
    (outputTokens / 1_000_000) * config.costPer1MOutput
  )
}