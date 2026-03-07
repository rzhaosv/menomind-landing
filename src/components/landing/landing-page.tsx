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
  const [exitShown, setExitShown] = useState(false)
  const [guideSending, setGuideSending] = useState(false)
  const [guideSent, setGuideSent] = useState(false)
  const quizRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (exitShown) return
      const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight)
      if (scrollPercent > 0.7) {
        setShowExitPopup(true)
        setExitShown(true)
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
        <div className="max-w-[720px] mx-auto flex justify-center">
          <span className="text-2xl font-bold text-brand-purple tracking-tight">MenoMind</span>
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
              <button
                key={i}
                type="button"
                onClick={() => toggleSymptom(i)}
                className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all w-full text-left ${
                  checkedSymptoms.has(i)
                    ? 'bg-brand-purple/10 border-2 border-brand-purple'
                    : 'bg-white border-2 border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                  checkedSymptoms.has(i)
                    ? 'bg-brand-purple border-brand-purple'
                    : 'border-gray-300'
                }`}>
                  {checkedSymptoms.has(i) && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium">{symptom}</span>
              </button>
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
        <div className="max-w-[520px] mx-auto">
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
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-6">Your Results</h2>
              <div className={`${resultConfig[resultLevel].bg} ${resultConfig[resultLevel].border} border-2 rounded-2xl p-6 mb-6`}>
                <p className={`text-lg font-bold ${resultConfig[resultLevel].color} mb-2`}>
                  {resultConfig[resultLevel].label}
                </p>
                <p className="text-gray-700 text-sm">
                  {resultConfig[resultLevel].message}
                </p>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600 text-sm">
                  Get personalized guidance, track your symptoms, and prepare for your next doctor&apos;s visit.
                </p>
                <Link href="/signup" className="btn-primary block">
                  Create Your Free Account →
                </Link>
                <p className="text-xs text-gray-500">
                  Free to start. No credit card required.
                </p>
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
                  {quizStep === QUIZ_QUESTIONS.length - 1 ? 'See Results' : 'Next →'}
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
              <p className="text-xs text-gray-500 mb-4">or $99/year (save 33%)</p>
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
            <h3 className="text-xl font-bold mb-2">
              {guideSent ? 'Check your inbox!' : 'Before you go — get your free guide'}
            </h3>
            {guideSent ? (
              <p className="text-gray-600 text-sm mb-4">
                We&apos;ve sent &quot;The 5 Signs It Might Be Perimenopause&quot; to <strong>{email}</strong>. If you don&apos;t see it, check your spam folder.
              </p>
            ) : (
              <>
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
                    onClick={async () => {
                      if (!email) return
                      setGuideSending(true)
                      try {
                        const res = await fetch('/api/guide', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email }),
                        })
                        if (res.ok) {
                          setGuideSent(true)
                        } else {
                          alert('Something went wrong. Please try again.')
                        }
                      } catch {
                        alert('Something went wrong. Please try again.')
                      } finally {
                        setGuideSending(false)
                      }
                    }}
                    disabled={guideSending || guideSent}
                    className="btn-primary text-sm whitespace-nowrap"
                  >
                    {guideSending ? 'Sending...' : guideSent ? 'Sent!' : 'Send Guide'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  No spam. Unsubscribe anytime.
                </p>
              </>
            )}
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
