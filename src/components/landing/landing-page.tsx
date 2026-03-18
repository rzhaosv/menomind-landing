'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
const SYMPTOMS_CHECKLIST = [
  'Anxiety that came out of nowhere',
  'Waking up at 3am and can\'t fall back asleep',
  'Hot flashes or drenching night sweats',
  'Brain fog so bad you forget words mid-sentence',
  'Exhausted no matter how much you sleep',
  'Periods that are all over the place',
  'Aches and pains that don\'t make sense',
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
    quizRef.current?.scrollIntoView({ behavior: 'smooth' })
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
            You&apos;re Not Losing Your Mind.{' '}
            <span className="block">It Might Be Your Hormones.</span>
          </h1>
          <p className="text-white/95 text-base mb-6 drop-shadow">
            The anxiety, the brain fog, the 3am wake-ups — there&apos;s a biological reason for all of it.
            Take our free 2-minute quiz and finally get answers that make sense.
          </p>
          <div className="mb-5">
            <Link href="/quiz" className="block w-full max-w-[340px] mx-auto bg-brand-pink text-white py-4 px-8 rounded-lg text-base font-semibold hover:bg-brand-pink-light transition-colors text-center">
              Take the Free Symptom Quiz &rarr;
            </Link>
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
            Sound familiar?
          </h2>
          <p className="text-gray-600 text-center mb-8">
            If you&apos;ve been told it&apos;s &quot;just stress&quot; or &quot;just aging,&quot; check how many of these you recognize:
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
                {checkedSymptoms.size} out of {SYMPTOMS_CHECKLIST.length} — you&apos;re not imagining this. Let&apos;s find out what&apos;s going on.
              </p>
              <Link href="/quiz" className="btn-primary mt-4 text-sm inline-block">
                Get My Free Results &rarr;
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 px-5 bg-white">
        <div className="max-w-[720px] mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            It&apos;s not you. The system wasn&apos;t built for this.
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
              <h3 className="font-semibold mb-2">1. Tell us what&apos;s going on</h3>
              <p className="text-sm text-gray-600">
                In your own words. No medical jargon needed.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-brand-pink/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-semibold mb-2">2. See the patterns</h3>
              <p className="text-sm text-gray-600">
                Finally understand why certain days are harder than others
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-brand-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🩺</span>
              </div>
              <h3 className="font-semibold mb-2">3. Know what to do next</h3>
              <p className="text-sm text-gray-600">
                Walk into your doctor&apos;s office prepared — and finally get taken seriously
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quiz Section — CTA to dedicated quiz funnel */}
      <section ref={quizRef} className="py-16 px-5 bg-white" id="quiz">
        <div className="max-w-[520px] mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Let&apos;s figure out what&apos;s going on
          </h2>
          <p className="text-gray-600 mb-6">
            Quick assessment. No account needed. You&apos;ll get a personalized
            breakdown of your symptoms and what they might mean — completely free.
          </p>
          <Link
            href="/quiz"
            onClick={() => {
              (window as any).gtag?.('event', 'landing_quiz_cta_click');
              (window as any).fbq?.('trackCustom', 'LandingQuizCTAClick');
            }}
            className="btn-primary inline-block text-base"
          >
            Take the Free Assessment &rarr;
          </Link>
          <p className="text-xs text-gray-500 mt-3">
            Takes 2 minutes &middot; No credit card required
          </p>
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
            Plans &amp; Pricing
          </h2>
          <p className="text-gray-600 text-center mb-10">
            Start with our free tier. Upgrade when you need more.
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
              <Link href="/try" className="btn-secondary text-sm block">
                Try It Free
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
                Start Premium
              </Link>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-4">
            Cancel anytime
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
            You deserve someone who actually listens
          </h2>
          <p className="text-white/80 mb-8">
            No judgment. No dismissal. Just real answers about what&apos;s happening in your body — for free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/quiz" className="bg-brand-pink text-white py-4 px-8 rounded-xl font-semibold hover:bg-brand-pink-light transition-colors inline-block">
              Take the Free Quiz
            </Link>
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
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
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
                onClick={async () => {
                  if (email) {
                    try {
                      await fetch('/api/waitlist/checkin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email }),
                      });
                      (window as any).gtag?.('event', 'conversion', { 'send_to': 'AW-17830146300/qbF8CJjiioccEPzhibZC', value: 1.0, currency: 'USD' });
                      (window as any).fbq?.('track', 'Lead')
                    } catch {
                      // silently fail
                    }
                    setShowExitPopup(false)
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
        <Link href="/quiz" className="block w-full bg-brand-pink text-white py-3 rounded-lg font-semibold text-sm text-center">
          Take the Free Quiz &rarr;
        </Link>
      </div>
    </div>
  )
}
