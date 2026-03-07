import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

const FROM_EMAIL = 'MenoMind <hello@menomind.app>'

export async function sendWelcomeEmail(email: string, name: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Welcome to MenoMind — Your Menopause Companion',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #6B3F8D; font-size: 24px;">Welcome to MenoMind, ${name}!</h1>
        <p style="color: #1A1A2E; font-size: 16px; line-height: 1.6;">
          We're so glad you're here. MenoMind is your AI-powered companion for navigating
          perimenopause and menopause with confidence.
        </p>
        <p style="color: #1A1A2E; font-size: 16px; line-height: 1.6;">
          Here's what you can do:
        </p>
        <ul style="color: #1A1A2E; font-size: 16px; line-height: 1.8;">
          <li><strong>Chat with our AI</strong> — Ask anything about your symptoms</li>
          <li><strong>Track your symptoms</strong> — Daily logging takes under 60 seconds</li>
          <li><strong>Follow wellness plans</strong> — Personalized to your needs</li>
        </ul>
        <a href="https://menomind.app/dashboard" style="display: inline-block; background: #6B3F8D; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin-top: 20px;">
          Go to Your Dashboard →
        </a>
        <p style="color: #888; font-size: 14px; margin-top: 40px;">
          You're not alone in this. We're here for you every step of the way.
        </p>
      </div>
    `,
  })
}

export async function sendTrialReminderEmail(
  email: string,
  name: string,
  daysLeft: number
) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Your MenoMind trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #6B3F8D; font-size: 24px;">Hi ${name},</h1>
        <p style="color: #1A1A2E; font-size: 16px; line-height: 1.6;">
          Your free premium trial ends in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>.
          Don't lose access to unlimited AI conversations, full symptom trends, and personalized wellness plans.
        </p>
        <a href="https://menomind.app/pricing" style="display: inline-block; background: #D65C8C; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin-top: 20px;">
          Keep Premium Access →
        </a>
        <p style="color: #888; font-size: 14px; margin-top: 40px;">
          Even without premium, you can still use MenoMind's free features. Your data is always safe.
        </p>
      </div>
    `,
  })
}

export async function sendFreeGuideEmail(email: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Your Free Guide: 5 Signs It Might Be Perimenopause',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #6B3F8D; font-size: 24px;">The 5 Signs It Might Be Perimenopause (Not Anxiety)</h1>
        <p style="color: #1A1A2E; font-size: 16px; line-height: 1.6;">
          Thank you for requesting our free guide. Here are the 5 signs that what you're experiencing
          might be perimenopause — not "just anxiety."
        </p>

        <div style="background: #FFFBF5; padding: 24px; border-radius: 12px; margin: 24px 0;">
          <h2 style="color: #6B3F8D; font-size: 18px; margin-top: 0;">1. Your anxiety appeared out of nowhere</h2>
          <p style="color: #1A1A2E; font-size: 15px; line-height: 1.6;">
            If you've never been an anxious person but suddenly feel on edge, racing heart, or dread —
            fluctuating estrogen and progesterone can directly affect your brain's GABA receptors,
            the same ones anti-anxiety medications target.
          </p>

          <h2 style="color: #6B3F8D; font-size: 18px;">2. You wake up at 3am and can't fall back asleep</h2>
          <p style="color: #1A1A2E; font-size: 15px; line-height: 1.6;">
            Early morning waking is a hallmark of perimenopause. Dropping progesterone — your body's
            natural sedative — disrupts your sleep architecture, especially in the second half of the night.
          </p>

          <h2 style="color: #6B3F8D; font-size: 18px;">3. Brain fog that makes you question yourself</h2>
          <p style="color: #1A1A2E; font-size: 15px; line-height: 1.6;">
            Forgetting words, losing your train of thought, feeling mentally "slow" — estrogen is a key
            neurotransmitter regulator. When it fluctuates, so does your cognitive clarity. This is
            temporary and treatable.
          </p>

          <h2 style="color: #6B3F8D; font-size: 18px;">4. Your symptoms cluster together</h2>
          <p style="color: #1A1A2E; font-size: 15px; line-height: 1.6;">
            Anxiety + sleep disruption + brain fog + fatigue isn't a coincidence. When multiple symptoms
            appear together in your late 30s to early 50s, hormonal changes are a likely common cause.
          </p>

          <h2 style="color: #6B3F8D; font-size: 18px;">5. Your doctor says "everything looks normal"</h2>
          <p style="color: #1A1A2E; font-size: 15px; line-height: 1.6;">
            Standard blood work often misses perimenopause because hormone levels fluctuate daily.
            A single test can look "normal" even when you're deep in the transition. Symptom tracking
            over time is far more revealing.
          </p>
        </div>

        <h2 style="color: #6B3F8D; font-size: 18px;">What to do next</h2>
        <p style="color: #1A1A2E; font-size: 16px; line-height: 1.6;">
          Start tracking your symptoms daily — even for just 2 weeks. Patterns tell a story that a
          single doctor's visit can't. MenoMind makes this easy with AI-guided tracking and
          personalized insights.
        </p>

        <a href="https://www.menomind.app/signup" style="display: inline-block; background: #D65C8C; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; margin-top: 20px;">
          Start Tracking Free →
        </a>

        <p style="color: #888; font-size: 14px; margin-top: 40px;">
          You're not imagining it. And you don't have to figure it out alone.
        </p>
      </div>
    `,
  })
}

export async function sendPaymentConfirmationEmail(
  email: string,
  name: string,
  plan: string,
  amount: string
) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Payment confirmed — MenoMind Premium',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #6B3F8D; font-size: 24px;">Payment Confirmed</h1>
        <p style="color: #1A1A2E; font-size: 16px; line-height: 1.6;">
          Hi ${name}, your MenoMind Premium ${plan} subscription is now active.
        </p>
        <div style="background: #FFFBF5; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 0; color: #1A1A2E;"><strong>Plan:</strong> ${plan}</p>
          <p style="margin: 8px 0 0; color: #1A1A2E;"><strong>Amount:</strong> ${amount}</p>
        </div>
        <p style="color: #888; font-size: 14px; margin-top: 40px;">
          Manage your subscription anytime in Settings.
        </p>
      </div>
    `,
  })
}
