/**
 * AI Conversion Triggers
 *
 * Detects when free-tier conversations naturally reach upgrade moments —
 * when the user asks for interpretation, action plans, or deeper analysis
 * that is gated behind premium.
 */

// Patterns indicating the user wants interpretation / actionable advice
const INTERPRETATION_PATTERNS: RegExp[] = [
  // Direct interpretation requests
  /what (should|can|do) i do/i,
  /what does (this|that|it) mean/i,
  /why (is|am|do|does) (this|that|it|my|i)/i,
  /how (can|do|should) i (fix|stop|manage|treat|handle|deal|cope|improve)/i,
  /what('s| is) causing/i,
  /is (this|it|that) normal/i,

  // Action plan requests
  /\bplan for (me|my)\b/i,
  /\brecommend(ation)?\b/i,
  /\bsuggest(ion)?\b/i,
  /what (supplement|vitamin|herb)/i,
  /should i (take|try|see|ask|start|stop)/i,

  // Deep analysis requests
  /\b(my|these) (symptom|pattern|trend)/i,
  /getting (worse|better|more frequent)/i,
  /\b(connected|related|linked)\b.*\b(symptom|to each other|together)\b/i,
  /what('s| is) (happening|going on) (with|to|in) my/i,

  // Doctor / treatment requests
  /what (to|should i) (say|ask|tell|bring).*(doctor|gp|ob-?gyn|provider)/i,
  /\b(treatment|therapy|hrt|hormone replacement)\b.*\b(option|right for me|should i)\b/i,
]

/**
 * Check whether a user message is asking for interpretation/action,
 * which is the premium boundary for free users.
 */
export function isInterpretationRequest(message: string): boolean {
  const trimmed = message.trim()
  if (trimmed.length < 10) return false

  return INTERPRETATION_PATTERNS.some(pattern => pattern.test(trimmed))
}

/**
 * Count how many upgrade prompts have already appeared in a conversation.
 * We never show more than 2 per conversation to avoid being pushy.
 */
export function countUpgradePrompts(assistantMessages: string[]): number {
  const UPGRADE_MARKER = '[UPGRADE_CTA]'
  return assistantMessages.filter(m => m.includes(UPGRADE_MARKER)).length
}

export const MAX_UPGRADE_PROMPTS_PER_CONVERSATION = 2

/**
 * The marker we inject into the system prompt so the AI knows to
 * include an upgrade CTA. We strip this from the final user-facing response.
 */
export const UPGRADE_CTA_MARKER = '[UPGRADE_CTA]'
