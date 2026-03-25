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
  const [step, setStep] = useState(0) // starts at Q1 immediately — no welcome screen
  const [phase, setPhase] = useState<Phase>('quiz')
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [analyzingStep, setAnalyzingStep] = useState(0)
  const [email, setEmail] = useState('')
  const [emailSubmitting, setEmailSubmitting] = useState(false)
  const [emailCaptured, setEmailCaptured] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual')
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // Track quiz start on page mount (no welcome screen — quiz IS the landing)
  useEffect(() => {
    function fireStart() {
      const w = window as any
      if (typeof w.gtag === 'function') {
        w.gtag('event', 'quiz_start')
        w.fbq?.('trackCustom', 'QuizStart')
        return true
      }
      return false
    }
    if (!fireStart()) {
      const interval = setInterval(() => {
        if (fireStart()) clearInterval(interval)
      }, 200)
      // Stop trying after 10 seconds
      setTimeout(() => clearInterval(interval), 10000)
    }
  }, [])

  // Track paywall shown
  useEffect(() => {
    if (phase === 'paywall') {
      const w = window as any
      w.gtag?.('event', 'quiz_s17_paywall')
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

  // ─── Screen names for per-step GA4 tracking ───
  const SCREEN_NAMES = [
    'quiz_s01_concern', 'quiz_s02_age', 'quiz_s03_education',
    'quiz_s04_timeline', 'quiz_s05_vasomotor', 'quiz_s06_somatic',
    'quiz_s07_periods', 'quiz_s08_history', 'quiz_s09_impact',
    'quiz_s10_education2', 'quiz_s11_goals', 'quiz_s12_tried',
    'quiz_s13_commitment',
  ]

  // ─── Navigation ───
  function advance() {
    // Track per-screen event for GA4 funnel analysis
    const w = window as any
    const screenEvent = SCREEN_NAMES[step] || `quiz_step_${step + 1}`
    w.gtag?.('event', screenEvent, { step: step + 1 })

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
    w.gtag?.('event', 'quiz_s14_analyzing')
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
          w.gtag?.('event', 'quiz_s15_reveal')
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
      w.gtag?.('event', 'quiz_s16_email')
      w.gtag?.('event', 'quiz_email_captured')
      w.gtag?.('event', 'conversion', {
        send_to: 'AW-17830146300/qbF8CJjiioccEPzhibZC',
        value: 1.0,
        currency: 'USD',
      })
      w.fbq?.('track', 'Lead')
      // Auto-advance to paywall after brief confirmation
      setTimeout(() => {
        const w2 = window as any
        w2.gtag?.('event', 'quiz_s17_paywall')
        setPhase('paywall')
      }, 1200)
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
    <div className="min-h-screen bg-sw-surface flex flex-col font-body text-sw-on-surface">
      {/* Header — Sophisticated Wellness glassmorphism */}
      <header className="fixed top-0 left-0 w-full px-6 py-4 flex items-center justify-between sw-glass z-50">
        {phase === 'quiz' && step > 0 ? (
          <button onClick={goBack} className="flex items-center gap-1 text-sw-on-surface-variant">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
        ) : (
          <div className="w-8" />
        )}
        <Link href="/" className="text-lg font-headline font-bold tracking-tight text-sw-primary">
          MenoMind
        </Link>
        <div className="text-sw-secondary text-sm font-medium">
          {phase === 'quiz' ? `Step ${step + 1} of ${SCREENS.length}` : ''}
        </div>
      </header>

      {/* Progress bar — sage green, slim */}
      <div className="fixed top-[60px] left-0 w-full h-1 bg-sw-surface-highest z-40">
        <div
          className="h-full bg-sw-secondary rounded-r-full transition-all duration-500 ease-out"
          style={{ width: `${getProgress()}%` }}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 pt-20 pb-28 px-6 flex items-start justify-center sm:items-center overflow-y-auto">
        <div className="w-full max-w-[520px]">
          {/* ─── QUIZ PHASE ─── */}
          {phase === 'quiz' && (() => {
            const screen = SCREENS[step]

            // Education screen — editorial card
            if (screen.screenType === 'education') {
              return (
                <div className="text-center animate-fadeIn">
                  <div className="w-14 h-14 bg-sw-secondary-container rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-2xl text-sw-secondary">school</span>
                  </div>
                  <h2 className="text-2xl font-headline font-bold text-sw-on-surface mb-4">
                    {screen.headline}
                  </h2>
                  <div className="bg-sw-surface-low rounded-2xl p-6 mb-6">
                    <p className="text-lg font-semibold text-sw-primary font-headline mb-2">
                      {screen.stat}
                    </p>
                    {screen.statSource && (
                      <p className="text-xs text-sw-on-surface-variant font-body">
                        Source: {screen.statSource}
                      </p>
                    )}
                  </div>
                  <p className="text-sw-on-surface-variant text-sm mb-8 font-body">{screen.body}</p>
                  {screen.socialProof && (
                    <p className="text-xs text-sw-on-surface-variant mb-6 font-body">
                      {screen.socialProof}
                    </p>
                  )}
                  <button onClick={advance} className="sw-gradient-cta text-white font-semibold py-4 px-6 rounded-xl w-full font-body">
                    Continue
                  </button>
                </div>
              )
            }

            // Commitment screen
            if (screen.screenType === 'commitment') {
              return (
                <div className="text-center animate-fadeIn">
                  <div className="w-14 h-14 bg-sw-secondary-container rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-2xl text-sw-secondary">verified</span>
                  </div>
                  <h2 className="text-2xl font-headline font-bold text-sw-on-surface mb-4">
                    {screen.headline}
                  </h2>
                  <p className="text-sw-on-surface-variant text-sm mb-8 font-body">{screen.body}</p>
                  <button
                    onClick={advance}
                    className="w-full sw-gradient-cta text-white font-semibold py-4 px-6 rounded-xl transition-colors text-lg font-body"
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

            const icons = (screen as any).icons as string[] | undefined

            return (
              <div className={step === 0 ? '' : 'animate-fadeIn'}>
                {/* Hybrid landing context on Q1 */}
                {step === 0 && (
                  <div className="text-center mb-6">
                    <h1 className="text-2xl sm:text-3xl font-headline font-bold text-sw-primary mb-1 leading-tight">
                      Could your symptoms be hormonal?
                    </h1>
                    <p className="text-sw-on-surface-variant text-sm font-body">
                      Answer 8 quick questions to find out
                    </p>
                  </div>
                )}

                {/* Micro-encouragement on later steps */}
                {step >= 8 && (
                  <p className="text-xs text-sw-secondary font-medium mb-3 font-body">
                    Almost there — your personalized results are coming together.
                  </p>
                )}

                <h2 className={`font-headline font-bold text-sw-on-surface mb-1 ${step === 0 ? 'text-xl' : 'text-2xl'}`}>
                  {q.title}
                </h2>
                {q.subtitle && (
                  <p className="text-sm text-sw-on-surface-variant mb-5 font-body">{q.subtitle}</p>
                )}

                <div className="space-y-3">
                  {q.options.map((option, idx) => {
                    const selected = currentAnswers.includes(option)
                    const icon = icons?.[idx]
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
                        className={`w-full text-left p-4 rounded-xl transition-all text-base font-medium font-body active:scale-[0.98] flex items-center gap-3 ${
                          selected
                            ? 'bg-sw-secondary-container border border-sw-secondary/40'
                            : 'bg-sw-surface-low hover:bg-sw-surface-high'
                        }`}
                      >
                        {icon && (
                          <span className={`material-symbols-outlined text-2xl shrink-0 ${selected ? 'text-sw-secondary' : 'text-sw-on-surface-variant'}`}>
                            {icon}
                          </span>
                        )}
                        <span className="flex-1">{option}</span>
                        <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                          selected ? 'border-sw-secondary bg-sw-secondary' : 'border-sw-outline-variant'
                        }`}>
                          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Trust signal on Q1 only */}
                {step === 0 && (
                  <p className="text-xs text-sw-on-surface-variant text-center mt-5 font-body">
                    Trusted by 14,000+ women &middot; Free &middot; Private
                  </p>
                )}

                {/* Fixed bottom nav for multi-select questions */}
                {q.type === 'multi' && (
                  <div className="fixed bottom-0 left-0 w-full px-6 py-4 sw-glass shadow-[0_-8px_24px_rgba(27,28,28,0.04)]">
                    <button
                      onClick={advance}
                      disabled={!hasAnswer}
                      className="w-full sw-gradient-cta text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed font-body"
                    >
                      Continue
                    </button>
                  </div>
                )}
              </div>
            )
          })()}

          {/* ─── ANALYZING PHASE ─── */}
          {phase === 'analyzing' && (
            <div className="text-center animate-fadeIn py-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-sw-secondary-container flex items-center justify-center pulse-animation">
                <span className="material-symbols-outlined text-4xl text-sw-secondary">biotech</span>
              </div>
              <h3 className="text-xl font-headline font-bold text-sw-on-surface mb-2">
                Crafting your personalized profile...
              </h3>
              <p className="text-sm text-sw-on-surface-variant font-body mb-6">
                Our AI is analyzing your responses
              </p>
              <div className="space-y-4 mt-6 text-left max-w-xs mx-auto">
                {ANALYZING_MESSAGES.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 transition-all duration-500 ${
                      i <= analyzingStep ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      i < analyzingStep ? 'bg-sw-secondary' : i === analyzingStep ? 'bg-sw-secondary-container' : 'bg-sw-surface-high'
                    }`}>
                      {i < analyzingStep ? (
                        <span className="material-symbols-outlined text-sm text-white">check</span>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-sw-secondary animate-pulse" />
                      )}
                    </div>
                    <span className={`text-sm font-body ${i <= analyzingStep ? 'text-sw-on-surface' : 'text-sw-on-surface-variant'}`}>
                      {msg}
                    </span>
                  </div>
                ))}
              </div>
              <div className="w-full h-1.5 bg-sw-surface-highest rounded-full overflow-hidden mt-8">
                <div
                  className="h-full bg-sw-secondary rounded-full transition-all duration-1000 ease-out"
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
                <h2 className="text-2xl font-headline font-bold text-center text-sw-on-surface mb-2">
                  Here&apos;s what we found
                </h2>
                <p className="text-sw-on-surface-variant text-center text-sm mb-6 font-body">
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

                {/* Inline email capture — no separate screen */}
                <div className="mt-6 bg-white rounded-2xl border-2 border-brand-purple/15 p-5 text-center">
                  <p className="text-sm font-semibold text-brand-dark mb-1">
                    Your full report is ready
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Enter your email to see the full breakdown + get a copy sent to you.
                  </p>
                  {emailCaptured ? (
                    <div className="text-sm text-green-600 font-medium py-2">
                      ✓ Sent! Continuing to your results...
                    </div>
                  ) : (
                    <>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          handleEmailSubmit(e)
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="input-field flex-1 text-sm"
                          required
                        />
                        <button
                          type="submit"
                          disabled={emailSubmitting}
                          className="bg-brand-pink text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-pink/90 transition-colors whitespace-nowrap disabled:opacity-50"
                        >
                          {emailSubmitting ? '...' : 'Get Report'}
                        </button>
                      </form>
                      <button
                        onClick={() => {
                          const w = window as any
                          w.gtag?.('event', 'quiz_email_skipped')
                          w.gtag?.('event', 'quiz_s17_paywall')
                          setPhase('paywall')
                        }}
                        className="text-xs text-gray-400 hover:text-gray-600 mt-3 underline"
                      >
                        Skip — show me the paywall
                      </button>
                    </>
                  )}
                </div>
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
                      w.gtag?.('event', 'quiz_s17_paywall')
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

          {/* ─── PAYWALL PHASE — $37 one-time report ─── */}
          {phase === 'paywall' && (() => {
            return (
              <div className="animate-fadeIn">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sw-secondary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-sw-secondary">description</span>
                  </div>
                  <h2 className="text-2xl font-headline font-bold text-sw-on-surface mb-2">
                    Your Hormonal Balance Profile is Ready
                  </h2>
                  <p className="text-sm text-sw-on-surface-variant font-body">
                    Get your personalized 12-page report with actionable insights.
                  </p>
                </div>

                {/* Value stack */}
                <div className="space-y-3 mb-6">
                  {[
                    { icon: 'analytics', title: 'Detailed Symptom Analysis', desc: 'How your symptoms connect and what they mean' },
                    { icon: 'assignment', title: 'Personalized Action Plan', desc: 'Evidence-based steps tailored to your profile' },
                    { icon: 'medical_information', title: 'Doctor Conversation Script', desc: 'Exactly what to say so your doctor takes you seriously' },
                    { icon: 'medication', title: 'Supplement & Lifestyle Guide', desc: 'What actually works — backed by clinical research' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3 p-4 bg-sw-surface-low rounded-xl">
                      <span className="material-symbols-outlined text-xl text-sw-secondary shrink-0 mt-0.5">{item.icon}</span>
                      <div>
                        <p className="text-sm font-semibold font-body text-sw-on-surface">{item.title}</p>
                        <p className="text-xs text-sw-on-surface-variant font-body">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price */}
                <div className="text-center mb-4">
                  <p className="text-sm text-sw-on-surface-variant font-body line-through mb-1">$97 value</p>
                  <p className="text-4xl font-headline font-bold text-sw-primary">
                    $37
                  </p>
                  <p className="text-sm text-sw-on-surface-variant font-body mt-1">
                    One-time payment &middot; Instant access
                  </p>
                </div>

                {/* CTA */}
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full sw-gradient-cta text-white font-semibold py-4 px-6 rounded-xl transition-all text-lg font-body disabled:opacity-50 active:scale-[0.98]"
                >
                  {checkoutLoading ? 'Loading...' : 'Get My Personalized Report — $37'}
                </button>

                {/* Trust signals */}
                <div className="flex flex-wrap justify-center gap-4 mt-5 text-xs text-sw-on-surface-variant font-body">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">lock</span> Secure checkout
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">verified_user</span> 30-day guarantee
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="flex -space-x-2">
                    {['S', 'M', 'J', 'L'].map((initial) => (
                      <div
                        key={initial}
                        className="w-7 h-7 rounded-full bg-sw-primary-container border-2 border-sw-surface flex items-center justify-center text-white text-xs font-bold"
                      >
                        {initial}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-sw-on-surface-variant font-body">
                    14,000+ women trust MenoMind
                  </p>
                </div>
              </div>
            )
          })()}
        </div>
      </main>

    </div>
  )
}
