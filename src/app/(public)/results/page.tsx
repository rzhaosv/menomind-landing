'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { SYMPTOM_CATEGORIES, ACTION_PLANS } from '@/lib/quiz/symptom-data'

interface TokenData {
  symptoms: string[]
  level: string
  categories: string[]
}

function parseToken(token: string | null): TokenData | null {
  if (!token) return null
  try {
    const decoded = JSON.parse(atob(token))
    if (
      Array.isArray(decoded.symptoms) &&
      typeof decoded.level === 'string' &&
      Array.isArray(decoded.categories)
    ) {
      return decoded as TokenData
    }
    return null
  } catch {
    return null
  }
}

function ResultsContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const data = parseToken(token)

  if (!data) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-5">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-brand-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h1 className="text-2xl font-bold text-brand-dark mb-3">
              Hmm, we couldn&apos;t load your results.
            </h1>
            <p className="text-gray-600 mb-6">
              The link may have expired or been corrupted. Want to take the quiz again?
            </p>
            <Link
              href="/#quiz"
              className="inline-block bg-brand-purple text-white py-3 px-8 rounded-xl font-semibold hover:bg-brand-purple-dark transition-colors"
            >
              Take the Quiz
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const { symptoms, level, categories } = data

  const levelConfig = {
    low: { label: 'Mild', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    moderate: { label: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    strong: { label: 'Significant', color: 'text-brand-pink', bg: 'bg-pink-50', border: 'border-pink-200' },
    significant: { label: 'Significant', color: 'text-brand-pink', bg: 'bg-pink-50', border: 'border-pink-200' },
  }

  const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.moderate
  const tryUrl = `/try?symptoms=${encodeURIComponent(symptoms.join(','))}&level=${level}`

  // Group symptoms by category
  const symptomsByCategory: Record<string, { symptom: string; explanation: string; prevalence: number }[]> = {}
  for (const symptom of symptoms) {
    for (const [catId, catData] of Object.entries(SYMPTOM_CATEGORIES)) {
      const symptomInfo = catData.symptoms[symptom]
      if (symptomInfo) {
        if (!symptomsByCategory[catId]) symptomsByCategory[catId] = []
        symptomsByCategory[catId].push({
          symptom,
          explanation: symptomInfo.explanation,
          prevalence: symptomInfo.prevalence,
        })
      }
    }
  }

  // Collect action plans from relevant categories
  const relevantPlans: { category: string; plans: { title: string; description: string }[] }[] = []
  for (const catId of categories) {
    const plans = ACTION_PLANS[catId]
    if (plans) {
      relevantPlans.push({ category: catId, plans })
    }
  }
  if (relevantPlans.length === 0 && ACTION_PLANS.general) {
    relevantPlans.push({ category: 'general', plans: ACTION_PLANS.general })
  }

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      <Header />

      <main className="flex-1 px-5 py-10">
        <div className="max-w-[640px] mx-auto">
          {/* Section 1: Header */}
          <div className="text-center mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark mb-3">
              Your Symptom Assessment Results
            </h1>
            <p className="text-gray-600 mb-4">Based on your quiz responses</p>
            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${config.color} ${config.bg} ${config.border} border`}>
              {config.label} Level
            </span>
          </div>

          {/* Section 2: Your Symptoms */}
          <div className="mb-10">
            <h2 className="text-lg font-bold mb-4">Your Symptoms</h2>
            <div className="space-y-4">
              {Object.entries(symptomsByCategory).map(([catId, catSymptoms]) => {
                const catData = SYMPTOM_CATEGORIES[catId]
                if (!catData) return null
                return (
                  <div key={catId} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span>{catData.icon}</span>
                      <h3 className="font-semibold text-sm">{catData.label}</h3>
                    </div>
                    <div className="space-y-3">
                      {catSymptoms.map(({ symptom, explanation, prevalence }) => (
                        <div key={symptom} className="pl-6">
                          <p className="text-sm font-medium text-brand-purple">{symptom}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{explanation}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {prevalence}% of women in perimenopause report this
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Show any symptoms that didn't match a category */}
              {symptoms
                .filter((s) => !Object.values(symptomsByCategory).flat().some((cs) => cs.symptom === s))
                .map((symptom) => (
                  <div key={symptom} className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-sm font-medium text-brand-purple">{symptom}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* Section 3: Personalized Action Plan */}
          <div className="mb-10">
            <h2 className="text-lg font-bold mb-4">Your Personalized Action Plan</h2>
            <div className="space-y-3">
              {relevantPlans.flatMap(({ plans }) => plans).map((plan, i) => (
                <div key={i} className="p-4 rounded-xl border bg-white border-gray-200">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 bg-brand-purple text-white">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{plan.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{plan.description}</p>
                      <p className="text-xs text-brand-purple/70 mt-1.5">
                        Your AI companion can walk you through this step by step{' '}
                        <Link href={tryUrl} className="underline font-medium text-brand-purple">
                          →
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Primary CTA */}
          <div className="mb-6">
            <Link
              href={tryUrl}
              className="block bg-brand-purple hover:bg-brand-purple-dark text-white text-center py-4 px-6 rounded-xl font-semibold transition-colors"
            >
              Talk to Your AI Companion About These Results
              <span className="block text-xs font-normal text-purple-200 mt-1">
                Free · No account needed · Get personalized answers now
              </span>
            </Link>
          </div>

          {/* Section 5: Secondary CTA */}
          <div className="text-center mb-10">
            <p className="text-sm text-gray-600 mb-2">
              Not ready to chat? Create a free account to save your results and track symptoms over time.
            </p>
            <Link
              href="/signup"
              className="text-sm text-brand-purple font-semibold hover:underline"
            >
              Create free account →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center">
          <span className="text-white text-sm font-bold">M</span>
        </div>
        <span className="font-semibold text-brand-dark">MenoMind</span>
      </Link>
      <Link
        href="/signup"
        className="text-sm text-brand-purple font-medium hover:underline"
      >
        Create free account
      </Link>
    </header>
  )
}

function Footer() {
  return (
    <footer className="py-6 px-5 border-t border-gray-200">
      <p className="text-xs text-gray-500 text-center max-w-lg mx-auto">
        MenoMind is a wellness tool, not a medical device. The information provided is for
        educational purposes only and is not intended as medical advice. Always consult a
        qualified healthcare provider.
      </p>
      <p className="text-xs text-gray-400 text-center mt-2">
        © {new Date().getFullYear()} MenoMind by Zenith Labs
      </p>
    </footer>
  )
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full" />
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  )
}
