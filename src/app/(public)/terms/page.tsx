import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — MenoMind',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <header className="py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-2xl font-bold text-brand-purple">
            MenoMind
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">
          Last updated: March 6, 2026
        </p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using MenoMind (&quot;the Service&quot;), you agree to be bound
              by these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed">
              MenoMind is an AI-powered wellness companion that provides personalized
              health information, symptom tracking, and wellness plans related to
              perimenopause and menopause. The Service is not a medical device and does
              not provide medical diagnoses or treatment recommendations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Medical Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed font-medium">
              THE INFORMATION PROVIDED BY MENOMIND IS FOR EDUCATIONAL AND INFORMATIONAL
              PURPOSES ONLY AND IS NOT INTENDED AS, AND SHALL NOT BE UNDERSTOOD OR
              CONSTRUED AS, MEDICAL ADVICE. Always seek the advice of your physician or
              other qualified health provider with any questions you may have regarding
              a medical condition. Never disregard professional medical advice or delay
              in seeking it because of something you have read or received from MenoMind.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Subscriptions and Payments</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Free accounts have limited access to features as described on our pricing page.</li>
              <li>Premium subscriptions are billed monthly ($14.99/mo) or annually ($99/yr).</li>
              <li>All payments are processed securely through Stripe.</li>
              <li>Subscriptions renew automatically unless cancelled before the renewal date.</li>
              <li>You may cancel your subscription at any time through your account settings.</li>
              <li>Upon cancellation, you retain premium access until the end of your current billing period.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Refund Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We offer a 14-day money-back guarantee for new paid subscriptions. If you
              are not satisfied within 14 days of your first payment, contact us for a
              full refund. After 14 days, payments are non-refundable except as required
              by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. User Responsibilities</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must provide accurate information when creating your account and health profile.</li>
              <li>You must not use the Service for any unlawful purpose.</li>
              <li>You must not attempt to reverse engineer, modify, or disrupt the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, MENOMIND AND ITS OPERATORS SHALL
              NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
              PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED
              DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, OR GOODWILL.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify
              users of material changes via email or in-app notification. Continued use
              of the Service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              For questions about these Terms, contact us at{' '}
              <a href="mailto:legal@menomind.app" className="text-brand-purple hover:underline">
                legal@menomind.app
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
