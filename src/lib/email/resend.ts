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
