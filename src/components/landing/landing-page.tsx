'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const SYMPTOMS_CHECKLIST = [
  'Unexplained anxiety or mood swings',
  'Difficulty sleeping or waking at 3am',
  'Hot flashes or night sweats',
  'Brain fog or trouble concentrating',
  'Fatigue despite sleeping enough',
  'Irregular or changing periods',
  'Joint pain or muscle aches',
]

const QUIZ_QUESTIONS = [
  {
    id: 'age',
    title: 'How old are you?',
    options: ['Under 35', '35-39', '40-44', '45-49', '50-54', '55+'],
    type: 'single' as const,
  },
  {
    id: 'cognitive',
    title: 'Are you experiencing any of these?',
    options: [
      'Anxiety or panic attacks',
      'Irritability or rage',
      'Brain fog or memory issues',
      'Feeling down or emotionally flat',
      'None of these',
    ],
    type: 'multi' as const,
  },
  {
    id: 'vasomotor',
    title: 'What about these physical symptoms?',
    options: [
      'Hot flashes',
      'Night sweats',
      'Heart palpitations',
      'Dizziness',
      'None of these',
    ],
    type: 'multi' as const,
  },
  {
    id: 'somatic',
    title: 'Any of these affecting you?',
    options: [
      'Sleep disruption',
      'Fatigue / low energy',
      'Joint or muscle pain',
      'Weight gain (especially midsection)',
      'None of these',
    ],
    type: 'multi' as const,
  },
  {
    id: 'periods',
    title: 'Have your periods changed?',
    options: [
      'Becoming irregular',
      'Heavier or lighter than usual',
      'Skipping months',
      'Stopped completely',
      'No changes',
    ],
    type: 'single' as const,
  },
  {
    id: 'history',
    title: 'Any family history of early menopause?',
    options: ['Yes', 'No', "I'm not sure"],
    type: 'single' as const,
  },
  {
    id: 'impact',
    title: 'How much are these symptoms affecting your daily life?',
    options: [
      'Not at all',
      'A little — manageable',
      'Moderately — affecting work/relationships',
      'Significantly — hard to function normally',
    ],
    type: 'single' as const,
  },
]

// Symptom category data for personalized results
const SYMPTOM_CATEGORIES = {
  cognitive: {
    label: 'Emotional & Cognitive',
    icon: '🧠',
    symptoms: {
      'Anxiety or panic attacks': {
        explanation: 'Hormonal fluctuations directly affect your nervous system. This is not "just stress."',
        prevalence: 62,
      },
      'Irritability or rage': {
        explanation: 'Estrogen drops affect serotonin regulation, causing intense emotional reactions that feel out of character.',
        prevalence: 70,
      },
      'Brain fog or memory issues': {
        explanation: 'Estrogen plays a key role in cognitive function. Many women describe feeling like they\'re "losing their mind."',
        prevalence: 60,
      },
      'Feeling down or emotionally flat': {
        explanation: 'Hormonal shifts can affect mood-regulating neurotransmitters, leading to emotional numbness or sadness.',
        prevalence: 45,
      },
    },
  },
  vasomotor: {
    label: 'Vasomotor Symptoms',
    icon: '🌡️',
    symptoms: {
      'Hot flashes': {
        explanation: 'Your body\'s thermostat is affected by changing estrogen levels, causing sudden waves of heat.',
        prevalence: 75,
      },
      'Night sweats': {
        explanation: 'The same temperature dysregulation that causes hot flashes intensifies during sleep.',
        prevalence: 68,
      },
      'Heart palpitations': {
        explanation: 'Estrogen fluctuations can affect heart rhythm. Often mistaken for anxiety or cardiac issues.',
        prevalence: 40,
      },
      'Dizziness': {
        explanation: 'Hormonal changes affect blood pressure regulation and inner ear function.',
        prevalence: 35,
      },
    },
  },
  somatic: {
    label: 'Physical & Sleep',
    icon: '😴',
    symptoms: {
      'Sleep disruption': {
        explanation: 'Progesterone — your natural sleep hormone — declines during perimenopause, disrupting your sleep architecture.',
        prevalence: 72,
      },
      'Fatigue / low energy': {
        explanation: 'Hormonal shifts affect your metabolism and energy production at a cellular level.',
        prevalence: 78,
      },
      'Joint or muscle pain': {
        explanation: 'Estrogen has anti-inflammatory properties. As levels drop, joint and muscle pain can increase.',
        prevalence: 55,
      },
      'Weight gain (especially midsection)': {
        explanation: 'Hormonal changes shift fat distribution and slow metabolism — this isn\'t about willpower.',
        prevalence: 65,
      },
    },
  },
  periods: {
    label: 'Menstrual Changes',
    icon: '📅',
    symptoms: {
      'Becoming irregular': {
        explanation: 'Irregular cycles are one of the earliest and most reliable signs of perimenopause.',
        prevalence: 80,
      },
      'Heavier or lighter than usual': {
        explanation: 'Fluctuating hormones cause unpredictable changes in menstrual flow.',
        prevalence: 65,
      },
      'Skipping months': {
        explanation: 'As ovulation becomes less regular, periods may come and go unpredictably.',
        prevalence: 50,
      },
      'Stopped completely': {
        explanation: 'If periods have stopped for 12+ consecutive months, you may have reached menopause.',
        prevalence: 30,
      },
    },
  },
}

// Personalized action plans based on symptom categories
const ACTION_PLANS: Record<string, { title: string; description: string }[]> = {
  cognitive: [
    { title: 'Daily mindfulness protocol for hormonal anxiety', description: 'A 10-minute evidence-based routine designed specifically for perimenopause-related anxiety.' },
    { title: 'Cognitive support nutrition guide', description: 'Foods and supplements that support brain function during hormonal transitions.' },
    { title: 'Stress-hormone balancing exercise plan', description: 'Movement patterns that reduce cortisol and support estrogen balance.' },
    { title: 'Sleep-mood connection optimization', description: 'How improving your sleep directly reduces anxiety and brain fog.' },
  ],
  vasomotor: [
    { title: 'Hot flash trigger identification protocol', description: 'Track and identify your personal triggers to reduce frequency by up to 40%.' },
    { title: 'Temperature regulation techniques', description: 'Evidence-based cooling strategies and breathing exercises for immediate relief.' },
    { title: 'Night sweat sleep environment guide', description: 'Optimize your sleep setup to minimize disruption from night sweats.' },
    { title: 'Dietary triggers elimination plan', description: 'Common foods that worsen vasomotor symptoms and what to eat instead.' },
  ],
  somatic: [
    { title: 'Evening wind-down protocol for hormonal sleep disruption', description: 'A step-by-step routine that works with your changing hormones, not against them.' },
    { title: 'Anti-inflammatory nutrition plan', description: 'Reduce joint pain and fatigue through targeted dietary changes.' },
    { title: 'Energy restoration exercise guide', description: 'Movement that boosts energy without overtaxing your system.' },
    { title: 'Weight management hormonal strategy', description: 'Why traditional diets fail in perimenopause and what actually works.' },
  ],
  general: [
    { title: 'Perimenopause symptom tracking starter guide', description: 'Learn what to track and how to spot patterns in your symptoms.' },
    { title: 'Doctor visit preparation checklist', description: 'Everything you need to advocate for yourself at your next appointment.' },
    { title: 'Hormone health daily routine', description: 'Morning and evening routines that support hormonal balance.' },
    { title: 'Perimenopause nutrition foundations', description: 'Key nutrients your body needs more of during this transition.' },
  ],
}

const TESTIMONIALS = [
  {
    name: 'Michelle T.',
    age: 46,
    location: 'Chicago',
    image: '/images/testimonial-michelle.png',
    quote:
      'I thought I was losing my mind. MenoMind helped me realize my anxiety and brain fog were likely perimenopause. I walked into my doctor\'s appointment prepared and finally got taken seriously.',
  },
  {
    name: 'Diane K.',
    age: 43,
    location: 'Austin',
    image: '/images/testimonial-diane.png',
    quote:
      'The symptom tracker is a game-changer. After 3 weeks of data, I could clearly see the patterns. My doctor was impressed with how organized my health information was.',
  },
  {
    name: 'Jennifer R.',
    age: 49,
    location: 'Seattle',
    image: '/images/testimonial-jennifer.png',
    quote:
      'The AI conversations feel like talking to a knowledgeable friend who actually understands what I\'m going through. No judgment, just evidence-based support.',
  },
]

export function LandingPage() {
  const [checkedSymptoms, setCheckedSymptoms] = useState<Set<number>>(new Set())
  const [quizStep, setQuizStep] = useState(-1) // -1 = not started
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string[]>>({})
  const [showResult, setShowResult] = useState(false)
  const [email, setEmail] = useState('')
  const [showExitPopup, setShowExitPopup] = useState(false)
  const [exitShown, setExitShown] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('menomind_exit_shown') === '1'
    }
    return false
  })
  const quizRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (exitShown) return
      const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight)
      if (scrollPercent > 0.7) {
        setShowExitPopup(true)
        setExitShown(true)
        sessionStorage.setItem('menomind_exit_shown', '1')
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [exitShown])

  function toggleSymptom(index: number) {
    setCheckedSymptoms((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function scrollToQuiz() {
    setQuizStep(0)
    setTimeout(() => {
      quizRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  function selectAnswer(questionId: string, answer: string, type: 'single' | 'multi') {
    setQuizAnswers((prev) => {
      if (type === 'single') return { ...prev, [questionId]: [answer] }
      const current = prev[questionId] || []
      if (answer.startsWith('None')) return { ...prev, [questionId]: [answer] }
      const filtered = current.filter((a) => !a.startsWith('None'))
      if (filtered.includes(answer)) {
        return { ...prev, [questionId]: filtered.filter((a) => a !== answer) }
      }
      return { ...prev, [questionId]: [...filtered, answer] }
    })
  }

  function nextQuestion() {
    if (quizStep < QUIZ_QUESTIONS.length - 1) {
      setQuizStep((s) => s + 1)
    } else {
      setShowResult(true)
    }
  }

  function getResultLevel(): 'low' | 'moderate' | 'strong' {
    let score = 0
    const a = quizAnswers
    if (a.age?.[0] && ['40-44', '45-49', '50-54'].includes(a.age[0])) score += 2
    if (a.age?.[0] === '35-39') score += 1
    if ((a.cognitive?.length || 0) > 0 && !a.cognitive?.includes('None of these')) score += a.cognitive!.length
    if ((a.vasomotor?.length || 0) > 0 && !a.vasomotor?.includes('None of these')) score += a.vasomotor!.length
    if ((a.somatic?.length || 0) > 0 && !a.somatic?.includes('None of these')) score += a.somatic!.length
    if (a.periods?.[0] && !['No changes'].includes(a.periods[0])) score += 2
    if (a.history?.[0] === 'Yes') score += 1
    if (a.impact?.[0]?.startsWith('Significantly')) score += 2
    else if (a.impact?.[0]?.startsWith('Moderately')) score += 1

    if (score >= 8) return 'strong'
    if (score >= 4) return 'moderate'
    return 'low'
  }

  // Get all reported symptoms across categories
  function getReportedSymptoms() {
    const reported: { category: string; symptom: string; explanation: string; prevalence: number }[] = []
    const categories = ['cognitive', 'vasomotor', 'somatic', 'periods'] as const

    for (const cat of categories) {
      const answers = quizAnswers[cat] || []
      if (answers.length === 0 || answers.includes('None of these') || answers.includes('No changes')) continue

      const catData = SYMPTOM_CATEGORIES[cat]
      for (const answer of answers) {
        const symptomData = catData.symptoms[answer as keyof typeof catData.symptoms]
        if (symptomData) {
          reported.push({
            category: cat,
            symptom: answer,
            explanation: symptomData.explanation,
            prevalence: symptomData.prevalence,
          })
        }
      }
    }
    return reported
  }

  // Get the total symptom count for score display
  function getSymptomScore() {
    const reported = getReportedSymptoms()
    const total = Object.values(SYMPTOM_CATEGORIES).reduce(
      (sum, cat) => sum + Object.keys(cat.symptoms).length, 0
    )
    return { reported: reported.length, total }
  }

  // Get action plans based on most prominent symptom category
  function getPersonalizedPlans() {
    const categoryCounts: Record<string, number> = {}
    const categories = ['cognitive', 'vasomotor', 'somatic'] as const

    for (const cat of categories) {
      const answers = quizAnswers[cat] || []
      if (answers.includes('None of these')) continue
      categoryCounts[cat] = answers.length
    }

    const topCategory = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'general'

    return ACTION_PLANS[topCategory] || ACTION_PLANS.general
  }

  // Get relevant testimonial based on symptoms
  function getRelevantTestimonials() {
    const hasAnxiety = quizAnswers.cognitive?.includes('Anxiety or panic attacks')
    const hasBrainFog = quizAnswers.cognitive?.includes('Brain fog or memory issues')
    const hasSleep = quizAnswers.somatic?.includes('Sleep disruption')

    // Prioritize testimonials that match user's symptoms
    const sorted = [...TESTIMONIALS].sort((a, b) => {
      let scoreA = 0, scoreB = 0
      if (hasAnxiety || hasBrainFog) {
        if (a.name === 'Michelle T.') scoreA += 2
        if (b.name === 'Michelle T.') scoreB += 2
      }
      if (hasSleep) {
        if (a.name === 'Diane K.') scoreA += 2
        if (b.name === 'Diane K.') scoreB += 2
      }
      return scoreB - scoreA
    })
    return sorted.slice(0, 2)
  }

  const resultLevel = getResultLevel()
  const resultConfig = {
    low: {
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      label: 'Low Likelihood',
      message: 'Based on your answers, perimenopause is less likely right now — but it\'s great that you\'re paying attention to your body.',
    },
    moderate: {
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      label: 'Moderate Likelihood',
      message: 'Your symptoms suggest perimenopause could be a factor. Many women start experiencing hormonal shifts earlier than expected.',
    },
    strong: {
      color: 'text-brand-pink',
      bg: 'bg-pink-50',
      border: 'border-pink-200',
      label: 'Strong Likelihood',
      message: 'Your symptom pattern is very consistent with perimenopause. You\'re not imagining it — these changes are real and common.',
    },
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-brand-cream/95 backdrop-blur-sm border-b border-brand-purple/[0.08] px-5 py-4">
        <div className="max-w-[720px] mx-auto flex items-center justify-between">
          <span className="text-2xl font-bold text-brand-purple tracking-tight">MenoMind</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-brand-purple transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="text-sm font-semibold bg-brand-purple text-white px-4 py-2 rounded-lg hover:bg-brand-purple-dark transition-colors">
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative py-16 px-5 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, rgba(107,63,141,0.65) 0%, rgba(107,63,141,0.35) 100%), url('/images/hero-woman.jpg') center/cover no-repeat`,
        }}
      >
        <div className="max-w-[720px] mx-auto relative z-10 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-4 drop-shadow-lg">
            Is It Anxiety or Perimenopause?{' '}
            <span className="block">Get Answers Free</span>
          </h1>
          <p className="text-white/95 text-base mb-6 drop-shadow">
            AI-powered symptom decoder built by women, for women. Find out if your anxiety,
            brain fog, and fatigue might be hormonal — in 2 minutes.
          </p>
          <div className="mb-5">
            <button onClick={scrollToQuiz} className="block w-full max-w-[340px] mx-auto bg-brand-pink text-white py-4 px-8 rounded-lg text-base font-semibold hover:bg-brand-pink-light transition-colors">
              Take the Free Symptom Quiz →
            </button>
            <p className="text-white/80 text-xs mt-2">No credit card required</p>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-brand-purple-light border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                  {['S', 'M', 'J', 'L'][i - 1]}
                </div>
              ))}
            </div>
            <p className="text-white/90 text-sm">Joined by 2,400+ women this month</p>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4 mt-6 text-white/80 text-xs">
            <span>🔒 Private & Encrypted</span>
            <span>🩺 Evidence-Based</span>
            <span>💯 14-Day Refund</span>
          </div>
        </div>
      </section>

      {/* Symptom Awareness */}
      <section className="py-16 px-5">
        <div className="max-w-[720px] mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">
            Does any of this sound familiar?
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Check the symptoms you&apos;re experiencing:
          </p>
          <div className="space-y-3 max-w-md mx-auto">
            {SYMPTOMS_CHECKLIST.map((symptom, i) => (
              <label
                key={i}
                className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                  checkedSymptoms.has(i)
                    ? 'bg-brand-purple/10 border-2 border-brand-purple'
                    : 'bg-white border-2 border-gray-100 hover:border-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checkedSymptoms.has(i)}
                  onChange={() => toggleSymptom(i)}
                  className="w-5 h-5 rounded accent-brand-purple"
                />
                <span className="text-sm font-medium">{symptom}</span>
              </label>
            ))}
          </div>
          {checkedSymptoms.size > 0 && (
            <div className="mt-6 text-center">
              <p className="text-brand-purple font-semibold">
                You checked {checkedSymptoms.size} of {SYMPTOMS_CHECKLIST.length} — that&apos;s worth looking into.
              </p>
              <button onClick={scrollToQuiz} className="btn-primary mt-4 text-sm">
                Take the Full Assessment →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 px-5 bg-white">
        <div className="max-w-[720px] mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            You&apos;re not imagining it. The system failed you.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <p className="text-4xl font-bold text-brand-purple mb-2">80%</p>
              <p className="text-sm text-gray-600">
                of OB-GYN residents feel &quot;barely comfortable&quot; treating perimenopause
              </p>
            </div>
            <div className="text-center p-6">
              <p className="text-4xl font-bold text-brand-pink mb-2">94%</p>
              <p className="text-sm text-gray-600">
                of women received zero education about menopause
              </p>
            </div>
            <div className="text-center p-6">
              <p className="text-4xl font-bold text-brand-purple mb-2">Age 56</p>
              <p className="text-sm text-gray-600">
                average age women seek treatment — up to 15 years of unnecessary suffering
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Section */}
      <section className="py-16 px-5">
        <div className="max-w-[720px] mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Meet MenoMind: Your AI Menopause Companion
          </h2>
          <p className="text-gray-600 text-center mb-8 max-w-xl mx-auto">
            Personalized AI chat, daily symptom tracking, and actionable wellness plans —
            all in one place. Built with evidence-based research and real empathy.
          </p>
          <div className="rounded-2xl overflow-hidden shadow-xl mb-8">
            <Image
              src="/images/app-screenshot.jpg"
              alt="MenoMind app screenshot showing symptom tracking and AI chat"
              width={720}
              height={480}
              className="w-full"
              priority
            />
          </div>

          {/* How It Works */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
            <div className="text-center">
              <div className="w-14 h-14 bg-brand-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="font-semibold mb-2">1. Tell us how you feel</h3>
              <p className="text-sm text-gray-600">
                Chat with our AI about your symptoms in plain language
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-brand-pink/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-semibold mb-2">2. Track & understand</h3>
              <p className="text-sm text-gray-600">
                Log symptoms daily and see patterns you&apos;d never notice alone
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-brand-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🩺</span>
              </div>
              <h3 className="font-semibold mb-2">3. Take action</h3>
              <p className="text-sm text-gray-600">
                Follow your personalized wellness plan and prep for doctor visits
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quiz Section */}
      <section ref={quizRef} className="py-16 px-5 bg-white" id="quiz">
        <div className={`${showResult ? 'max-w-[640px]' : 'max-w-[520px]'} mx-auto`}>
          {quizStep === -1 ? (
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Could it be perimenopause?
              </h2>
              <p className="text-gray-600 mb-6">
                Take this 2-minute assessment to find out. Based on clinical screening criteria.
              </p>
              <button onClick={() => setQuizStep(0)} className="btn-primary">
                Start the Assessment →
              </button>
            </div>
          ) : showResult ? (
            <div className="max-w-[600px] mx-auto">
              {/* Section 1: Personalized Symptom Score */}
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
                Your Perimenopause Symptom Profile
              </h2>

              {(() => {
                const { reported, total } = getSymptomScore()
                const percentage = Math.round((reported / total) * 100)
                const scoreColors = {
                  low: { ring: 'text-green-500', track: 'text-green-100' },
                  moderate: { ring: 'text-yellow-500', track: 'text-yellow-100' },
                  strong: { ring: 'text-red-500', track: 'text-red-100' },
                }
                const severityLabels = { low: 'Mild', moderate: 'Moderate', strong: 'Significant' }
                const colors = scoreColors[resultLevel]

                return (
                  <div className={`${resultConfig[resultLevel].bg} ${resultConfig[resultLevel].border} border-2 rounded-2xl p-8 mb-8 text-center`}>
                    {/* Circular Progress Ring */}
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="50" fill="none" strokeWidth="10"
                          className={colors.track} stroke="currentColor" />
                        <circle cx="60" cy="60" r="50" fill="none" strokeWidth="10"
                          className={colors.ring} stroke="currentColor"
                          strokeLinecap="round"
                          strokeDasharray={`${percentage * 3.14} ${314 - percentage * 3.14}`} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-2xl font-bold ${resultConfig[resultLevel].color}`}>
                          {reported}
                        </span>
                        <span className="text-xs text-gray-500">of {total}</span>
                      </div>
                    </div>
                    <p className={`text-lg font-bold ${resultConfig[resultLevel].color} mb-2`}>
                      {severityLabels[resultLevel]} Symptom Level
                    </p>
                    <p className="text-gray-700 text-sm">
                      Based on your answers, you&apos;re experiencing {reported} common perimenopause symptom{reported !== 1 ? 's' : ''}.
                    </p>
                    <p className="text-gray-600 text-sm mt-2">
                      {resultConfig[resultLevel].message}
                    </p>
                  </div>
                )
              })()}

              {/* Section 2: Symptom Breakdown */}
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-4">What Your Symptoms Tell Us</h3>
                <div className="space-y-3">
                  {(['cognitive', 'vasomotor', 'somatic', 'periods'] as const).map((catKey) => {
                    const cat = SYMPTOM_CATEGORIES[catKey]
                    const answers = quizAnswers[catKey] || []
                    const hasSymptoms = answers.length > 0 && !answers.includes('None of these') && !answers.includes('No changes')

                    if (!hasSymptoms) {
                      return (
                        <div key={catKey} className="p-4 rounded-xl bg-gray-50 border border-gray-100 opacity-60">
                          <div className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <span className="font-medium text-gray-400 text-sm">{cat.label}</span>
                            <span className="text-xs text-gray-400 ml-auto">Not reported</span>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div key={catKey} className="p-4 rounded-xl bg-white border-2 border-brand-purple/20 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <span>{cat.icon}</span>
                          <span className="font-semibold text-sm">{cat.label}</span>
                        </div>
                        <div className="space-y-2">
                          {answers.map((answer) => {
                            const data = cat.symptoms[answer as keyof typeof cat.symptoms]
                            if (!data) return null
                            return (
                              <div key={answer} className="pl-6">
                                <p className="text-sm font-medium text-brand-purple">{answer}</p>
                                <p className="text-xs text-gray-600 mt-0.5">{data.explanation}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {data.prevalence}% of women in your age group report this
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Section 3: Personalized Action Plan Preview */}
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-4">Your Personalized Action Plan</h3>
                <div className="space-y-3">
                  {getPersonalizedPlans().map((plan, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border ${
                        i < 2
                          ? 'bg-white border-gray-200'
                          : 'bg-gray-50 border-gray-100 relative overflow-hidden'
                      }`}
                    >
                      {i >= 2 && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex items-center justify-center">
                          <span className="bg-brand-purple text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1">
                            🔒 Unlock with Premium
                          </span>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          i < 2 ? 'bg-brand-purple text-white' : 'bg-gray-300 text-white'
                        }`}>
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{plan.title}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{plan.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: CTA Block */}
              <div className="mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    href="/signup"
                    className="block bg-green-600 hover:bg-green-700 text-white text-center py-4 px-6 rounded-xl font-semibold transition-colors"
                  >
                    Start Tracking Free
                    <span className="block text-xs font-normal text-green-100 mt-1">
                      No credit card required
                    </span>
                  </Link>
                  <Link
                    href="/signup?plan=premium"
                    className="block border-2 border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white text-center py-4 px-6 rounded-xl font-semibold transition-colors"
                  >
                    Get Full Access
                    <span className="block text-xs font-normal mt-1 opacity-80">
                      7-day free trial · Cancel anytime
                    </span>
                  </Link>
                </div>
              </div>

              {/* Section 5: Social Proof */}
              <div className="space-y-4">
                {getRelevantTestimonials().map((t) => (
                  <div key={t.name} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200">
                    <Image
                      src={t.image}
                      alt={t.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className="text-yellow-400 text-sm">★</span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 italic">&quot;{t.quote}&quot;</p>
                      <p className="text-xs text-gray-500 mt-2 font-medium">
                        {t.name}, {t.age} — {t.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Question {quizStep + 1} of {QUIZ_QUESTIONS.length}</span>
                  <span>{Math.round(((quizStep + 1) / QUIZ_QUESTIONS.length) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-purple rounded-full transition-all duration-300"
                    style={{ width: `${((quizStep + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Micro-encouragement after Q4 */}
              {quizStep >= 4 && (
                <p className="text-xs text-brand-purple font-medium mb-3">
                  Almost done! Your personalized results are being prepared.
                </p>
              )}

              <h3 className="text-xl font-bold mb-4">{QUIZ_QUESTIONS[quizStep].title}</h3>
              <div className="space-y-3">
                {QUIZ_QUESTIONS[quizStep].options.map((option) => {
                  const selected = quizAnswers[QUIZ_QUESTIONS[quizStep].id]?.includes(option)
                  return (
                    <button
                      key={option}
                      onClick={() =>
                        selectAnswer(
                          QUIZ_QUESTIONS[quizStep].id,
                          option,
                          QUIZ_QUESTIONS[quizStep].type
                        )
                      }
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
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setQuizStep((s) => Math.max(0, s - 1))}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                  disabled={quizStep === 0}
                >
                  ← Back
                </button>
                <button
                  onClick={nextQuestion}
                  className="btn-primary text-sm"
                  disabled={!quizAnswers[QUIZ_QUESTIONS[quizStep].id]?.length}
                >
                  {quizStep === QUIZ_QUESTIONS.length - 1 ? 'See My Results →' : 'Next →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-5">
        <div className="max-w-[720px] mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            Women like you are finding answers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card text-center">
                <Image
                  src={t.image}
                  alt={t.name}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                />
                <p className="text-sm text-gray-600 italic mb-4">&quot;{t.quote}&quot;</p>
                <p className="font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-gray-500">
                  {t.age}, {t.location}
                </p>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-8 mt-10 text-sm text-gray-600">
            <span>2,400+ women assessed</span>
            <span>4.8/5 satisfaction</span>
            <span>Evidence-based</span>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-5 bg-white">
        <div className="max-w-[720px] mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Start free. Upgrade when you&apos;re ready.
          </h2>
          <p className="text-gray-600 text-center mb-10">
            Every account includes a 7-day free trial of Premium.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg mx-auto">
            <div className="card border-2 border-gray-200 text-center">
              <h3 className="font-semibold text-gray-700 mb-2">Free</h3>
              <p className="text-3xl font-bold mb-4">$0</p>
              <ul className="text-sm text-gray-600 space-y-2 text-left mb-6">
                <li>✓ 5 AI messages/day</li>
                <li>✓ Daily symptom logging</li>
                <li>✓ 7-day trends</li>
                <li>✓ 1 wellness plan</li>
              </ul>
              <Link href="/signup" className="btn-secondary text-sm block">
                Get Started
              </Link>
            </div>
            <div className="card border-2 border-brand-purple text-center relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-purple text-white text-xs font-semibold px-3 py-1 rounded-full">
                Most Popular
              </span>
              <h3 className="font-semibold text-brand-purple mb-2">Premium</h3>
              <p className="text-3xl font-bold mb-1">$14.99<span className="text-sm font-normal text-gray-500">/mo</span></p>
              <p className="text-xs text-gray-500 mb-4">or $99/year — save $80</p>
              <ul className="text-sm text-gray-700 space-y-2 text-left mb-6">
                <li>✓ Unlimited AI conversations</li>
                <li>✓ Full symptom history</li>
                <li>✓ All 5 wellness plans</li>
                <li>✓ Doctor visit prep reports</li>
                <li>✓ Weekly AI insights</li>
              </ul>
              <Link href="/signup" className="btn-primary text-sm block">
                Start 7-Day Free Trial
              </Link>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-4">
            14-day money-back guarantee · Cancel anytime
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-5">
        <div className="max-w-[600px] mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {[
              {
                q: 'Is this a substitute for a doctor?',
                a: 'No. MenoMind is a wellness companion that provides evidence-based information and support. It does not diagnose conditions or prescribe treatments. Always consult your healthcare provider for medical decisions.',
              },
              {
                q: 'How is my data protected?',
                a: 'All data is encrypted at rest and in transit. We never share your personal or health data with third parties. You can export or delete all your data at any time from your settings.',
              },
              {
                q: "I'm not sure I'm in perimenopause — is this still for me?",
                a: "Absolutely! Many women use MenoMind to understand whether their symptoms might be hormonal. That's exactly what our assessment and tracking tools are designed for.",
              },
              {
                q: 'What if I don\'t find it helpful?',
                a: 'We offer a 7-day free trial so you can explore all premium features with no risk. If you subscribe and it\'s not for you, we have a 14-day money-back guarantee.',
              },
              {
                q: 'Is the AI actually knowledgeable about menopause?',
                a: 'Our AI is powered by Claude, trained on the latest medical literature about perimenopause and menopause. It provides evidence-based information with appropriate citations and always recommends consulting your doctor for medical decisions.',
              },
            ].map((faq) => (
              <details key={faq.q} className="card cursor-pointer group">
                <summary className="font-semibold flex items-center justify-between">
                  {faq.q}
                  <span className="text-brand-purple group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="mt-3 text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-5 bg-brand-purple text-white text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            You&apos;ve been waiting for someone to listen
          </h2>
          <p className="text-white/80 mb-8">
            MenoMind is here. Start understanding your body today — for free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={scrollToQuiz} className="bg-brand-pink text-white py-4 px-8 rounded-xl font-semibold hover:bg-brand-pink-light transition-colors">
              Take the Free Quiz
            </button>
            <Link href="/signup" className="bg-white text-brand-purple py-4 px-8 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-5 bg-brand-dark text-white/60">
        <div className="max-w-[720px] mx-auto">
          <p className="text-xs leading-relaxed mb-6">
            MenoMind is a wellness tool, not a medical device. The information provided is for
            educational purposes only and is not intended as medical advice. Always consult a
            qualified healthcare provider. Individual results may vary.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm mb-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>
          <p className="text-xs text-center">
            © {new Date().getFullYear()} MenoMind by Zenith Labs. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Exit Intent Popup */}
      {showExitPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowExitPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close popup"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold mb-2">Before you go — get your free guide</h3>
            <p className="text-brand-purple font-semibold mb-4">
              The 5 Signs It Might Be Perimenopause (Not Anxiety)
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="input-field flex-1"
              />
              <button
                onClick={() => {
                  if (email) {
                    setShowExitPopup(false)
                    alert('Guide sent! Check your email.')
                  }
                }}
                className="btn-primary text-sm whitespace-nowrap"
              >
                Send Guide
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      )}

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 sm:hidden bg-white border-t border-gray-200 p-3">
        <button onClick={scrollToQuiz} className="w-full bg-brand-pink text-white py-3 rounded-lg font-semibold text-sm">
          Take the Free Quiz →
        </button>
      </div>
    </div>
  )
}
