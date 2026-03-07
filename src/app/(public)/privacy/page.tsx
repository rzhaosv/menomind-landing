import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — MenoMind',
}

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">
          Last updated: March 6, 2026
        </p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
            <p className="text-gray-700 leading-relaxed">
              MenoMind collects the following information to provide our services:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
              <li><strong>Account information:</strong> Name, email address, and password when you create an account.</li>
              <li><strong>Health information:</strong> Symptom logs, menopause stage, health conditions, medications, and wellness goals that you voluntarily provide.</li>
              <li><strong>Conversation data:</strong> Messages exchanged with our AI companion.</li>
              <li><strong>Usage data:</strong> How you interact with our service, including pages visited and features used.</li>
              <li><strong>Payment information:</strong> Processed securely by Stripe. We do not store your payment card details.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>To provide personalized AI health guidance and wellness plans</li>
              <li>To track and analyze your symptom patterns over time</li>
              <li>To improve our service and user experience</li>
              <li>To process payments and manage subscriptions</li>
              <li>To send transactional emails (account confirmations, subscription updates)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Data Sharing</h2>
            <p className="text-gray-700 leading-relaxed">
              We do <strong>not</strong> sell, share, or disclose your personal or health data
              to third parties, except:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
              <li><strong>Service providers:</strong> We use Supabase (database), Stripe (payments), Resend (email), and Anthropic (AI) to operate our service. These providers process data only as necessary to provide their services.</li>
              <li><strong>AI conversations:</strong> Your conversations are sent to Anthropic&apos;s Claude API for processing. Per Anthropic&apos;s API usage policy, API data is not used to train their models.</li>
              <li><strong>Legal requirements:</strong> If required by law or legal process.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              All data is encrypted at rest and in transit (TLS). We implement row-level
              security to ensure you can only access your own data. We follow industry
              best practices for data protection.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
              <li><strong>Access:</strong> Export all your data at any time from Settings.</li>
              <li><strong>Delete:</strong> Delete your account and all associated data from Settings.</li>
              <li><strong>Correct:</strong> Update your profile information at any time.</li>
              <li><strong>Opt-out:</strong> Manage email preferences in Settings.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-2">
              These rights apply to all users regardless of location, in compliance
              with CCPA (California) and GDPR (EU) regulations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your data for as long as your account is active. When you delete
              your account, all data is permanently removed within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Medical Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed">
              MenoMind is a wellness application, not a medical device. The information
              provided is for educational and informational purposes only and is not
              intended as medical advice. Always consult a qualified healthcare provider
              for medical decisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              For privacy-related questions, contact us at{' '}
              <a href="mailto:privacy@menomind.app" className="text-brand-purple hover:underline">
                privacy@menomind.app
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
