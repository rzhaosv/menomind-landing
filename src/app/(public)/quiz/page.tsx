'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  buildQuizScreens,
  ANALYZING_MESSAGES,
  type QuizScreen,
} from '@/lib/quiz/extended-questions'
import { SYMPTOM_CATEGORIES, ACTION_PLANS } from '@/lib/quiz/symptom-data'

const SCREENS = buildQuizScreens()
// Total visual steps: quiz screens + analyzing + partial reveal + email + paywall
const TOTAL_STEPS = SCREENS.length + 4

type Phase = 'quiz' | 'analyzing' | 'reveal' | 'email' | 'paywall'

export default function QuizPage() {
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<Phase>('quiz')
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [analyzingStep, setAnalyzingStep] = useState(0)
  const [email, setEmail] = useState('')
  const [emailSubmitting, setEmailSubmitting] = useState(false)
  const [emailCaptured, setEmailCaptured] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual')
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // Track quiz start — retry until gtag is loaded (race condition with afterInteractive)
  useEffect(() => {
    function fireQuizStart() {
      const w = window as any
      if (typeof w.gtag === 'function') {
        w.gtag('event', 'quiz_start')
        w.fbq?.('trackCustom', 'QuizStart')
        return true
      }
      return false
    }
    if (!fireQuizStart()) {
      const interval = setInterval(() => {
        if (fireQuizStart()) clearInterval(interval)
      }, 200)
      // Stop trying after 10 seconds
      setTimeout(() => clearInterval(interval), 10000)
    }
  }, [])

  // Track paywall shown
  useEffect(() => {
    if (phase === 'paywall') {
      const w = window as any
      w.gtag?.('event', 'quiz_paywall_shown')
      w.fbq?.('trackCustom', 'QuizPaywallShown')
    }
  }, [phase])

  // ─── Scoring logic (mirrored from landing page) ───
  function getResultLevel(): 'low' | 'moderate' | 'strong' {
    let score = 0
    const a = answers
    if (a.age?.[0] && ['40-44', '45-49', '50-54'].includes(a.age[0])) score += 2
    if (a.age?.[0] === '35-39') score += 1
    if ((a.cognitive?.length || 0) > 0 && !a.cognitive?.includes('None of these'))
      score += a.cognitive!.length
    if ((a.vasomotor?.length || 0) > 0 && !a.vasomotor?.includes('None of these'))
      score += a.vasomotor!.length
    if ((a.somatic?.length || 0) > 0 && !a.somatic?.includes('None of these'))
      score += a.somatic!.length
    if (a.periods?.[0] && !['No changes'].includes(a.periods[0])) score += 2
    if (a.history?.[0] === 'Yes') score += 1
    if (a.impact?.[0]?.startsWith("It's overwhelming")) score += 2
    else if (a.impact?.[0]?.startsWith('A lot')) score += 1

    if (score >= 8) return 'strong'
    if (score >= 4) return 'moderate'
    return 'low'
  }

  function getReportedSymptoms() {
    const reported: {
      category: string
      symptom: string
      explanation: string
      prevalence: number
    }[] = []
    const categories = ['cognitive', 'vasomotor', 'somatic', 'periods'] as const
    for (const cat of categories) {
      const ans = answers[cat] || []
      if (
        ans.length === 0 ||
        ans.includes('None of these') ||
        ans.includes('No changes')
      )
        continue
      const catData = SYMPTOM_CATEGORIES[cat]
      for (const answer of ans) {
        const d = (
          catData.symptoms as Record<
            string,
            { explanation: string; prevalence: number }
          >
        )[answer]
        if (d) reported.push({ category: cat, symptom: answer, ...d })
      }
    }
    return reported
  }

  function getSymptomScore() {
    const reported = getReportedSymptoms()
    const total = Object.values(SYMPTOM_CATEGORIES).reduce(
      (sum, cat) => sum + Object.keys(cat.symptoms).length,
      0
    )
    return { reported: reported.length, total }
  }

  function getTopSymptomNames() {
    return getReportedSymptoms()
      .slice(0, 2)
      .map((s) => s.symptom.toLowerCase())
  }

  function getPersonalizedPlans() {
    const categoryCounts: Record<string, number> = {}
    const categories = ['cognitive', 'vasomotor', 'somatic'] as const
    for (const cat of categories) {
      const ans = answers[cat] || []
      if (ans.includes('None of these')) continue
      categoryCounts[cat] = ans.length
    }
    const topCategory =
      Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      'general'
    return ACTION_PLANS[topCategory] || ACTION_PLANS.general
  }

  // ─── Answer handling ───
  function selectAnswer(
    questionId: string,
    answer: string,
    type: 'single' | 'multi'
  ) {
    setAnswers((prev) => {
      if (type === 'single') return { ...prev, [questionId]: [answer] }
      const current = prev[questionId] || []
      if (answer.startsWith('None') || answer === 'No changes')
        return { ...prev, [questionId]: [answer] }
      const filtered = current.filter(
        (a) => !a.startsWith('None') && a !== 'No changes'
      )
      if (filtered.includes(answer))
        return { ...prev, [questionId]: filtered.filter((a) => a !== answer) }
      return { ...prev, [questionId]: [...filtered, answer] }
    })
  }

  // ─── Auto-advance for single-select questions ───
  function handleSingleSelect(questionId: string, answer: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: [answer] }))
    // Auto-advance after brief visual feedback
    setTimeout(() => advance(), 250)
  }

  // ─── Navigation ───
  function advance() {
    // Track step progression
    const w = window as any
    w.gtag?.('event', 'quiz_step', {
      step: step + 1,
      total: TOTAL_STEPS,
    })

    if (step < SCREENS.length - 1) {
      setStep((s) => s + 1)
    } else {
      // Done with quiz screens → analyzing
      startAnalyzing()
    }
  }

  function goBack() {
    if (phase === 'email') {
      setPhase('reveal')
      return
    }
    if (phase === 'reveal') {
      setPhase('analyzing') // don't go back to analyzing, go to last quiz step
      setStep(SCREENS.length - 1)
      setPhase('quiz')
      return
    }
    if (step > 0) setStep((s) => s - 1)
  }

  // ─── Analyzing phase ───
  function startAnalyzing() {
    setPhase('analyzing')
    setAnalyzingStep(0)

    const w = window as any
    w.gtag?.('event', 'quiz_analyzing')
    w.fbq?.('trackCustom', 'QuizAnalyzing')

    // Rotate through messages
    let current = 0
    const interval = setInterval(() => {
      current++
      if (current >= ANALYZING_MESSAGES.length) {
        clearInterval(interval)
        setTimeout(() => {
          setPhase('reveal')
          const level = getResultLevel()
          const { reported } = getSymptomScore()
          w.gtag?.('event', 'quiz_complete', {
            result_level: level,
            symptom_count: reported,
          })
          w.fbq?.('trackCustom', 'QuizComplete', {
            result_level: level,
            symptom_count: reported,
          })
        }, 800)
      } else {
        setAnalyzingStep(current)
      }
    }, 1200)
  }

  // ─── Email capture ───
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return

    setEmailSubmitting(true)
    try {
      await fetch('/api/waitlist/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          quizSymptoms: getReportedSymptoms().map((s) => s.symptom),
          quizLevel: getResultLevel(),
        }),
      })
      setEmailCaptured(true)
      const w = window as any
      w.gtag?.('event', 'quiz_email_captured')
      w.gtag?.('event', 'conversion', {
        send_to: 'AW-17830146300/qbF8CJjiioccEPzhibZC',
        value: 1.0,
        currency: 'USD',
      })
      w.fbq?.('track', 'Lead')
      // Auto-advance to paywall after brief confirmation
      setTimeout(() => setPhase('paywall'), 1200)
    } catch {
      // silently continue
    } finally {
      setEmailSubmitting(false)
    }
  }

  // ─── Stripe checkout ───
  async function handleCheckout() {
    setCheckoutLoading(true)
    const w = window as any
    w.gtag?.('event', 'quiz_trial_click', { billing: billingCycle })
    w.gtag?.('event', 'conversion', {
      send_to: 'AW-17830146300/qbF8CJjiioccEPzhibZC',
      value: 1.0,
      currency: 'USD',
    })
    w.fbq?.('track', 'InitiateCheckout')

    try {
      const res = await fetch('/api/stripe/checkout-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingCycle }),
      })
      if (res.ok) {
        const { url } = await res.json()
        if (url) window.location.href = url
      }
    } finally {
      setCheckoutLoading(false)
    }
  }

  // ─── Progress calculation ───
  function getProgress() {
    if (phase === 'quiz') return ((step + 1) / TOTAL_STEPS) * 100
    if (phase === 'analyzing') return ((SCREENS.length + 1) / TOTAL_STEPS) * 100
    if (phase === 'reveal') return ((SCREENS.length + 2) / TOTAL_STEPS) * 100
    if (phase === 'email') return ((SCREENS.length + 3) / TOTAL_STEPS) * 100
    return 100 // paywall
  }

  // ─── Result config ───
  const resultLevel = getResultLevel()
  const resultConfig = {
    low: {
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      label: 'Mild',
      ringColor: 'text-green-500',
      trackColor: 'text-green-100',
      message:
        "Your symptoms are mild right now, but the fact that you're here means you're listening to your body. That matters.",
    },
    moderate: {
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      label: 'Moderate',
      ringColor: 'text-yellow-500',
      trackColor: 'text-yellow-100',
      message:
        "What you're describing is incredibly common in women your age. You're not stressed, broken, or imagining things — your hormones are shifting.",
    },
    strong: {
      color: 'text-brand-pink',
      bg: 'bg-pink-50',
      border: 'border-pink-200',
      label: 'Significant',
      ringColor: 'text-red-500',
      trackColor: 'text-red-100',
      message:
        "Everything you're feeling makes sense. This isn't anxiety, it isn't burnout, and you're definitely not losing your mind. Your symptom pattern is textbook perimenopause.",
    },
  }
  const rc = resultConfig[resultLevel]

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-brand-cream/95 backdrop-blur-sm border-b border-brand-purple/[0.08] px-5 py-3">
        <div className="max-w-[520px] mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold text-brand-purple tracking-tight"
          >
            MenoMind
          </Link>
          {phase === 'quiz' && step > 0 && (
            <button
              onClick={goBack}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              &larr; Back
            </button>
          )}
        </div>
      </header>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-200">
        <div
          className="h-full bg-brand-purple rounded-r-full transition-all duration-500 ease-out"
          style={{ width: `${getProgress()}%` }}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-start justify-center px-5 py-6 sm:py-8 sm:items-center overflow-y-auto">
        <div className="w-full max-w-[520px]">
          {/* ─── QUIZ PHASE ─── */}
          {phase === 'quiz' && (() => {
            const screen = SCREENS[step]

            // Education screen
            if (screen.screenType === 'education') {
              return (
                <div className="text-center animate-fadeIn">
                  <div className="w-14 h-14 bg-brand-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl">💡</span>
                  </div>
                  <h2 className="text-2xl font-bold text-brand-dark mb-4">
                    {screen.headline}
                  </h2>
                  <div className="bg-white rounded-2xl p-6 border-2 border-brand-purple/15 mb-6">
                    <p className="text-lg font-semibold text-brand-purple mb-2">
                      {screen.stat}
                    </p>
                    {screen.statSource && (
                      <p className="text-xs text-gray-400">
                        Source: {screen.statSource}
                      </p>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-8">{screen.body}</p>
                  {screen.socialProof && (
                    <p className="text-xs text-gray-500 mb-6">
                      {screen.socialProof}
                    </p>
                  )}
                  <button onClick={advance} className="btn-primary w-full">
                    Continue
                  </button>
                </div>
              )
            }

            // Commitment screen
            if (screen.screenType === 'commitment') {
              return (
                <div className="text-center animate-fadeIn">
                  <div className="w-14 h-14 bg-brand-pink/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl">✨</span>
                  </div>
                  <h2 className="text-2xl font-bold text-brand-dark mb-4">
                    {screen.headline}
                  </h2>
                  <p className="text-gray-600 text-sm mb-8">{screen.body}</p>
                  <button
                    onClick={advance}
                    className="w-full bg-brand-pink text-white font-semibold py-4 px-6 rounded-xl hover:bg-brand-pink/90 transition-colors text-lg"
                  >
                    {screen.buttonText}
                  </button>
                </div>
              )
            }

            // Question screen
            const q = screen
            const currentAnswers = answers[q.id] || []
            const hasAnswer = currentAnswers.length > 0

            return (
              <div className="animate-fadeIn">
                {/* Micro-encouragement on later steps */}
                {step >= 8 && (
                  <p className="text-xs text-brand-purple font-medium mb-3">
                    Almost there — your personalized results are coming together.
                  </p>
                )}

                <h2 className="text-xl sm:text-2xl font-bold text-brand-dark mb-1">
                  {q.title}
                </h2>
                {q.subtitle && (
                  <p className="text-sm text-gray-500 mb-5">{q.subtitle}</p>
                )}

                <div className="space-y-3">
                  {q.options.map((option) => {
                    const selected = currentAnswers.includes(option)
                    return (
                      <button
                        key={option}
                        onClick={() => {
                          if (q.type === 'single') {
                            handleSingleSelect(q.id, option)
                          } else {
                            selectAnswer(q.id, option, q.type)
                          }
                        }}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all text-sm font-medium ${
                          selected
                            ? 'border-brand-purple bg-brand-purple/10 text-brand-purple'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>

                {/* Next button for multi-select questions */}
                {q.type === 'multi' && (
                  <button
                    onClick={advance}
                    disabled={!hasAnswer}
                    className="btn-primary w-full mt-6 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next &rarr;
                  </button>
                )}
              </div>
            )
          })()}

          {/* ─── ANALYZING PHASE ─── */}
          {phase === 'analyzing' && (
            <div className="text-center animate-fadeIn py-8">
              <div className="w-16 h-16 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4 border-brand-purple/20" />
                <div className="absolute inset-0 rounded-full border-4 border-brand-purple border-t-transparent animate-spin" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                Analyzing your responses...
              </h3>
              <div className="space-y-3 mt-6">
                {ANALYZING_MESSAGES.map((msg, i) => (
                  <p
                    key={i}
                    className={`text-sm transition-all duration-500 ${
                      i <= analyzingStep
                        ? 'text-gray-700 opacity-100'
                        : 'text-gray-400 opacity-0'
                    }`}
                  >
                    {i < analyzingStep ? '✓' : i === analyzingStep ? '...' : ''}{' '}
                    {msg}
                  </p>
                ))}
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-8">
                <div
                  className="h-full bg-brand-purple rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${((analyzingStep + 1) / ANALYZING_MESSAGES.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* ─── PARTIAL REVEAL PHASE ─── */}
          {phase === 'reveal' && (() => {
            const { reported, total } = getSymptomScore()
            const percentage = Math.round((reported / total) * 100)
            const allSymptoms = getReportedSymptoms()
            // Show first 2 symptoms, blur the rest
            const visible = allSymptoms.slice(0, 2)
            const blurredCount = allSymptoms.length - visible.length

            return (
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold text-center mb-2">
                  Here&apos;s what we found
                </h2>
                <p className="text-gray-500 text-center text-sm mb-6">
                  Based on your responses, here&apos;s your symptom profile.
                </p>

                {/* Score ring */}
                <div
                  className={`${rc.bg} ${rc.border} border-2 rounded-2xl p-6 mb-6 text-center`}
                >
                  <div className="relative w-28 h-28 mx-auto mb-3">
                    <svg
                      className="w-28 h-28 -rotate-90"
                      viewBox="0 0 120 120"
                    >
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        strokeWidth="10"
                        className={rc.trackColor}
                        stroke="currentColor"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        strokeWidth="10"
                        className={rc.ringColor}
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeDasharray={`${percentage * 3.14} ${314 - percentage * 3.14}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl font-bold ${rc.color}`}>
                        {reported}
                      </span>
                      <span className="text-xs text-gray-500">of {total}</span>
                    </div>
                  </div>
                  <p className={`text-lg font-bold ${rc.color} mb-1`}>
                    {rc.label} Symptom Level
                  </p>
                  <p className="text-gray-600 text-sm">{rc.message}</p>
                </div>

                {/* Visible symptoms */}
                <div className="space-y-3 mb-4">
                  {visible.map((s) => {
                    const catData = SYMPTOM_CATEGORIES[s.category as keyof typeof SYMPTOM_CATEGORIES]
                    return (
                      <div
                        key={s.symptom}
                        className="p-4 rounded-xl bg-white border-2 border-brand-purple/20"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span>{catData?.icon}</span>
                          <span className="text-sm font-semibold text-brand-purple">
                            {s.symptom}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 pl-6">
                          {s.explanation}
                        </p>
                        <p className="text-xs text-gray-400 pl-6 mt-0.5">
                          {s.prevalence}% of women in your age group report this
                        </p>
                      </div>
                    )
                  })}
                </div>

                {/* Blurred remaining symptoms + action plans */}
                {(blurredCount > 0 || true) && (
                  <div className="relative">
                    <div className="blur-sm select-none pointer-events-none">
                      {allSymptoms.slice(2, 4).map((s) => (
                        <div
                          key={s.symptom}
                          className="p-4 rounded-xl bg-white border border-gray-200 mb-3"
                        >
                          <p className="text-sm font-semibold text-gray-700">
                            {s.symptom}
                          </p>
                          <p className="text-xs text-gray-500">
                            {s.explanation}
                          </p>
                        </div>
                      ))}
                      {getPersonalizedPlans()
                        .slice(0, 2)
                        .map((plan, i) => (
                          <div
                            key={i}
                            className="p-4 rounded-xl bg-white border border-gray-200 mb-3"
                          >
                            <p className="text-sm font-semibold">
                              {plan.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {plan.description}
                            </p>
                          </div>
                        ))}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-cream/80 to-brand-cream flex items-end justify-center pb-4">
                      <p className="text-sm text-gray-500 font-medium">
                        {blurredCount > 0
                          ? `+ ${blurredCount} more symptom${blurredCount > 1 ? 's' : ''} & your personalized action plan`
                          : 'Your personalized action plan is ready'}
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    const w = window as any
                    w.gtag?.('event', 'quiz_reveal_continue')
                    setPhase('email')
                  }}
                  className="btn-primary w-full mt-6"
                >
                  See My Full Report &rarr;
                </button>
              </div>
            )
          })()}

          {/* ─── EMAIL CAPTURE PHASE ─── */}
          {phase === 'email' && (
            <div className="text-center animate-fadeIn">
              <div className="w-14 h-14 bg-brand-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">📧</span>
              </div>
              <h2 className="text-2xl font-bold text-brand-dark mb-2">
                Your full symptom report is ready
              </h2>
              <p className="text-gray-600 text-sm mb-1">
                Where should we send it?
              </p>
              <p className="text-xs text-gray-400 mb-6">
                Includes: detailed symptom breakdown, personalized action plan,
                and a check-in in a few days.
              </p>

              {emailCaptured ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                  <p className="text-sm text-green-700 font-medium">
                    ✓ Got it! Check your email for your full report.
                  </p>
                </div>
              ) : (
                <>
                  <form
                    onSubmit={handleEmailSubmit}
                    className="flex gap-2 max-w-sm mx-auto"
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="input-field flex-1 text-sm"
                      required
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={emailSubmitting}
                      className="btn-primary text-sm whitespace-nowrap disabled:opacity-50"
                    >
                      {emailSubmitting ? '...' : 'Get My Report'}
                    </button>
                  </form>
                  <p className="text-xs text-gray-400 mt-4">
                    Join 2,400+ women who&apos;ve taken this assessment
                  </p>
                  <button
                    onClick={() => {
                      const w = window as any
                      w.gtag?.('event', 'quiz_email_skipped')
                      setPhase('paywall')
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 mt-3 underline"
                  >
                    Skip for now
                  </button>
                </>
              )}
            </div>
          )}

          {/* ─── PAYWALL PHASE ─── */}
          {phase === 'paywall' && (() => {
            const topSymptoms = getTopSymptomNames()
            const paywallHeadline =
              topSymptoms.length >= 2
                ? `Your plan for managing ${topSymptoms[0]} and ${topSymptoms[1]} is ready`
                : topSymptoms.length === 1
                  ? `Your plan for managing ${topSymptoms[0]} is ready`
                  : 'Your personalized perimenopause plan is ready'

            return (
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold text-center text-brand-dark mb-6">
                  {paywallHeadline}
                </h2>

                {/* Value pillars */}
                <div className="space-y-3 mb-6">
                  {[
                    {
                      icon: '🔍',
                      title: 'Full Symptom Breakdown',
                      desc: 'Why each symptom is happening and how they connect',
                    },
                    {
                      icon: '🩺',
                      title: 'Doctor-Ready Report',
                      desc: 'A printable report so your doctor takes you seriously',
                    },
                    {
                      icon: '📋',
                      title: 'Personalized Action Plan',
                      desc: 'Week-by-week steps tailored to your symptoms',
                    },
                    {
                      icon: '💬',
                      title: 'AI Menopause Companion',
                      desc: 'Ask anything, anytime — evidence-based answers 24/7',
                    },
                  ].map((pillar) => (
                    <div
                      key={pillar.title}
                      className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200"
                    >
                      <span className="text-xl shrink-0 mt-0.5">
                        {pillar.icon}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{pillar.title}</p>
                        <p className="text-xs text-gray-600">{pillar.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Billing toggle */}
                <div className="flex items-center justify-center gap-3 mb-4">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                      billingCycle === 'monthly'
                        ? 'bg-brand-purple text-white'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('annual')}
                    className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                      billingCycle === 'annual'
                        ? 'bg-brand-purple text-white'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Annual
                    <span className="ml-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">
                      Save 44%
                    </span>
                  </button>
                </div>

                {/* Price display */}
                <div className="text-center mb-4">
                  {billingCycle === 'annual' ? (
                    <>
                      <p className="text-3xl font-bold text-brand-dark">
                        $79.99
                        <span className="text-sm font-normal text-gray-500">
                          /year
                        </span>
                      </p>
                      <p className="text-sm text-gray-500">
                        That&apos;s just $6.67/month
                      </p>
                    </>
                  ) : (
                    <p className="text-3xl font-bold text-brand-dark">
                      $14.99
                      <span className="text-sm font-normal text-gray-500">
                        /month
                      </span>
                    </p>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full bg-brand-pink text-white font-semibold py-4 px-6 rounded-xl hover:bg-brand-pink/90 transition-colors shadow-lg shadow-brand-pink/20 text-lg disabled:opacity-50"
                >
                  {checkoutLoading
                    ? 'Loading...'
                    : 'Start for $1 — first week'}
                </button>
                <p className="text-xs text-gray-400 text-center mt-2">
                  {billingCycle === 'annual'
                    ? '$1 for your first week, then $79.99/year. Cancel anytime.'
                    : '$1 for your first week, then $14.99/month. Cancel anytime.'}
                </p>

                {/* Trust signals */}
                <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs text-gray-500">
                  <span>🔒 Encrypted & private</span>
                  <span>💯 14-day money-back guarantee</span>
                </div>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="flex -space-x-2">
                    {['S', 'M', 'J', 'L'].map((initial) => (
                      <div
                        key={initial}
                        className="w-7 h-7 rounded-full bg-brand-purple-light border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                      >
                        {initial}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    2,400+ women this month
                  </p>
                </div>
              </div>
            )
          })()}
        </div>
      </main>

      {/* Subtle footer on quiz screens */}
      {phase === 'quiz' && (
        <footer className="text-center py-3 text-xs text-gray-400">
          🔒 Your answers are private and encrypted
        </footer>
      )}

    </div>
  )
}
