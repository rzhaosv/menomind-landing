import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM_EMAIL = 'MenoMind <hello@menomind.app>'

export async function sendTrialEndingEmail(
  email: string,
  name: string,
  daysLeft: number,
  patternSummary?: string
) {
  const subject =
    daysLeft <= 1
      ? 'Your $1 week ends tomorrow — here\'s what you\'ve discovered'
      : `Your $1 week ends in ${daysLeft} days`

  const patternSection = patternSummary
    ? `
      <div style="background: #FFF8F0; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #C4956A;">
        <p style="margin: 0; color: #1A1A2E; font-weight: 600; font-size: 15px;">What we've learned about your patterns:</p>
        <p style="margin: 8px 0 0; color: #444; font-size: 14px; line-height: 1.6;">${patternSummary}</p>
      </div>`
    : ''

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1A1A2E;">
        <h1 style="font-size: 22px; font-weight: 600; margin-bottom: 16px;">Hi ${name},</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #444;">
          Your $1 trial week ${daysLeft <= 1 ? 'ends tomorrow' : `ends in ${daysLeft} days`}.
          After that, your subscription continues at the regular price — keeping all
          your conversations, symptom data, and personalized insights intact.
        </p>
        ${patternSection}
        <p style="font-size: 16px; line-height: 1.6; color: #444;">
          If MenoMind isn't right for you, no worries — you can cancel anytime
          from your Settings page and you won't be charged again.
        </p>
        <a href="https://menomind.app/dashboard" style="display: inline-block; background: #1A1A2E; color: white; padding: 14px 28px; border-radius: 100px; text-decoration: none; font-weight: 600; font-size: 15px; margin-top: 16px;">
          Go to My Dashboard →
        </a>
        <p style="color: #999; font-size: 13px; margin-top: 32px; line-height: 1.5;">
          Questions? Just reply to this email. We're real people and we read every one.
        </p>
      </div>
    `,
  })
}

export async function sendPaymentFailedEmail(
  email: string,
  name: string
) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Action needed — we couldn\'t process your payment',
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1A1A2E;">
        <h1 style="font-size: 22px; font-weight: 600; margin-bottom: 16px;">Hi ${name},</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #444;">
          We tried to process your MenoMind subscription payment but it didn't go through.
          No worries — your premium access is safe for the next 3 days while you update your card.
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #444;">
          Your conversations, symptom history, and wellness plans are all waiting for you.
        </p>
        <a href="https://menomind.app/settings/subscription" style="display: inline-block; background: #1A1A2E; color: white; padding: 14px 28px; border-radius: 100px; text-decoration: none; font-weight: 600; font-size: 15px; margin-top: 16px;">
          Update Payment Method →
        </a>
        <p style="color: #999; font-size: 13px; margin-top: 32px; line-height: 1.5;">
          If you'd like to cancel instead, you can do that from your Settings page. Your data stays safe either way.
        </p>
      </div>
    `,
  })
}

export async function sendWinbackEmail(
  email: string,
  name: string
) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'We miss you — come back for $1',
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1A1A2E;">
        <h1 style="font-size: 22px; font-weight: 600; margin-bottom: 16px;">Hi ${name},</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #444;">
          It's been a little while since you've been on MenoMind, and we wanted to let you
          know we've been busy making things better.
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #444;">
          Your previous conversations and symptom data are still here, exactly where you left them.
          If you'd like to pick back up, you can restart with a $1 first week — just like the first time.
        </p>
        <a href="https://menomind.app/pricing" style="display: inline-block; background: #1A1A2E; color: white; padding: 14px 28px; border-radius: 100px; text-decoration: none; font-weight: 600; font-size: 15px; margin-top: 16px;">
          Come Back for $1 →
        </a>
        <p style="color: #999; font-size: 13px; margin-top: 32px; line-height: 1.5;">
          No pressure at all. This is a one-time offer and you can unsubscribe from these emails anytime.
        </p>
      </div>
    `,
  })
}
