import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM_EMAIL = 'MenoMind <hello@menomind.app>'
const REPLY_TO = 'midnight.chatter126@gmail.com'

export async function sendNurtureEmail(
  email: string,
  resultsUrl?: string,
  scheduledAt?: Date
) {
  await resend.emails.send({
    ...(scheduledAt && { scheduledAt: scheduledAt.toISOString() }),
    from: FROM_EMAIL,
    to: email,
    replyTo: REPLY_TO,
    subject: "It's not anxiety. It's not aging. It's hormones.",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
        <div style="background: linear-gradient(135deg, #6B3F8D, #8B5AAF); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">MenoMind</h1>
        </div>
        <div style="padding: 32px; background: #fff;">
          <p>Hi there,</p>
          <p>Here's something most women don't hear until it's years too late:</p>
          <p>The average woman experiences perimenopause symptoms for <strong>4-8 years</strong> before getting a correct diagnosis. Not because the symptoms aren't real — but because they show up as anxiety, insomnia, brain fog, and fatigue. Things that get blamed on stress. Or age. Or "just being a woman."</p>
          <p>You took the quiz because something felt off. That instinct? Trust it.</p>
          <p><strong>Perimenopause isn't a switch that flips at 50.</strong> It's a gradual shift that can start as early as your late 30s. And it doesn't just affect your period — it affects your brain, your sleep, your mood, your joints, your gut, and your confidence.</p>
          <p>The problem isn't your body. The problem is that nobody connects the dots.</p>
          <p>That's exactly what MenoMind was built to do. Our AI tracks your symptoms daily — not just individually, but as patterns. So when you walk into your doctor's office, you're not saying "I've been tired and anxious." You're saying "Here's 30 days of data showing a clear hormonal pattern."</p>
          <p>That's the difference between being dismissed and being heard.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://menomind.app/dashboard" style="background: #6B3F8D; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Start Tracking Your Symptoms</a>
          </div>
          <p>You're not imagining it. And you don't have to figure it out alone.</p>
          <p style="color: #444; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee;">
            <strong>P.S.</strong> I'm genuinely curious — what made you take the quiz? And did the results match what you were feeling? Just hit reply — I read every one.
          </p>
          <p style="color: #666;">— Ray, MenoMind founder</p>
          ${resultsUrl ? `<p style="font-size: 13px; color: #888;">P.S. If you haven't looked at your quiz results yet, they're still waiting for you. <a href="${resultsUrl}" style="color: #6B3F8D;">View Results →</a></p>` : ''}
        </div>
        <div style="padding: 16px 32px; background: #F5F0F9; text-align: center; font-size: 12px; color: #888; border-radius: 0 0 12px 12px;">
          <p><a href="https://www.menomind.app" style="color: #6B3F8D;">menomind.app</a> · Built for women navigating perimenopause</p>
        </div>
      </div>
    `,
  })
}

export async function sendTrialEndingEmail(
  email: string,
  name: string,
  daysLeft: number,
  patternSummary?: string
) {
  const subject =
    daysLeft <= 1
      ? 'Your trial week ends tomorrow — here\'s what you\'ve discovered'
      : `Your trial week ends in ${daysLeft} days`

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
    replyTo: REPLY_TO,
    subject,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1A1A2E;">
        <h1 style="font-size: 22px; font-weight: 600; margin-bottom: 16px;">Hi ${name},</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #444;">
          Your trial week ${daysLeft <= 1 ? 'ends tomorrow' : `ends in ${daysLeft} days`}.
          After that, your subscription continues seamlessly — keeping all
          your conversations, symptom data, and personalized insights intact.
        </p>
        ${patternSection}
        <p style="font-size: 16px; line-height: 1.6; color: #444;">
          If MenoMind isn't right for you, no worries — you can cancel anytime
          from your Settings page and you won't be charged again.
        </p>
        <a href="https://menomind.app/settings/subscription" style="display: inline-block; background: #1A1A2E; color: white; padding: 14px 28px; border-radius: 100px; text-decoration: none; font-weight: 600; font-size: 15px; margin-top: 16px;">
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
    replyTo: REPLY_TO,
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

export async function sendPersonalCheckIn(
  email: string,
  scheduledAt?: Date
) {
  await resend.emails.send({
    ...(scheduledAt && { scheduledAt: scheduledAt.toISOString() }),
    from: 'Ray from MenoMind <hello@menomind.app>',
    to: email,
    replyTo: REPLY_TO,
    subject: 'Quick question about your quiz results',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.8; padding: 20px;">
        <p>Hey,</p>
        <p>You took the MenoMind symptom quiz a few days ago. I'm Ray, the founder, and I wanted to ask you something real:</p>
        <p><strong>Did anything in your results surprise you?</strong></p>
        <p>I built MenoMind because someone close to me went through years of symptoms before anyone connected the dots. I want to make sure this tool actually helps women like you — not just generates data.</p>
        <p>If you have 30 seconds, just reply with what you thought. Even "it was okay" or "not helpful" helps me improve it.</p>
        <p>No sales pitch. Just listening.</p>
        <p>— Ray</p>
        <p style="font-size: 12px; color: #999; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
          You're receiving this because you took the MenoMind symptom quiz. <a href="https://menomind.app" style="color: #6B3F8D;">menomind.app</a>
        </p>
      </div>
    `,
  })
}

export async function sendWelcomeEmail(email: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    replyTo: REPLY_TO,
    subject: "Welcome to MenoMind — here's your first step",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
        <div style="background: linear-gradient(135deg, #6B3F8D, #8B5AAF); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to MenoMind</h1>
        </div>
        <div style="padding: 32px; background: #fff;">
          <p>You just took one of the most important steps in understanding what your body is going through. Most women wait years before they connect the dots — you're already ahead.</p>

          <p style="font-weight: 600; font-size: 16px; margin-top: 24px;">Here's how to get the most out of your first week:</p>

          <div style="background: #F5F0F9; padding: 20px; border-radius: 12px; margin: 16px 0;">
            <p style="margin: 0 0 12px; font-weight: 600;">1. Talk to your AI companion</p>
            <p style="margin: 0 0 16px; font-size: 14px; color: #555;">Ask anything — "Is this perimenopause?", "Why am I waking up at 3am?", "What should I tell my doctor?" You'll get personalized, evidence-based answers instantly.</p>

            <p style="margin: 0 0 12px; font-weight: 600;">2. Log your symptoms daily</p>
            <p style="margin: 0 0 16px; font-size: 14px; color: #555;">It takes 30 seconds. After 7 days, you'll start seeing patterns you can't spot on your own — like which symptoms cluster together and when they peak.</p>

            <p style="margin: 0 0 12px; font-weight: 600;">3. Generate a doctor-ready report</p>
            <p style="margin: 0; font-size: 14px; color: #555;">After a week of tracking, you can download a formatted report to bring to your next appointment. No more being dismissed.</p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="https://menomind.app/dashboard" style="background: #6B3F8D; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Go to My Dashboard</a>
          </div>

          <p style="font-size: 14px; color: #666;">Every Monday, you'll get a personalized check-in email with insights based on your symptom patterns. Keep logging and your reports will get more accurate over time.</p>

          <p style="color: #666;">— The MenoMind Team</p>
        </div>
        <div style="padding: 16px 32px; background: #F5F0F9; text-align: center; font-size: 12px; color: #888; border-radius: 0 0 12px 12px;">
          <p><a href="https://www.menomind.app" style="color: #6B3F8D;">menomind.app</a> · Built for women navigating perimenopause</p>
          <p style="margin-top: 8px;"><a href="https://menomind.app/settings/subscription" style="color: #888;">Manage subscription</a></p>
        </div>
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
    replyTo: REPLY_TO,
    subject: 'We miss you — come back to MenoMind',
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1A1A2E;">
        <h1 style="font-size: 22px; font-weight: 600; margin-bottom: 16px;">Hi ${name},</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #444;">
          It's been a little while since you've been on MenoMind, and we wanted to let you
          know we've been busy making things better.
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #444;">
          Your previous conversations and symptom data are still here, exactly where you left them.
          If you'd like to pick back up, you can restart anytime from your account portal.
        </p>
        <a href="https://menomind.app/settings/subscription" style="display: inline-block; background: #1A1A2E; color: white; padding: 14px 28px; border-radius: 100px; text-decoration: none; font-weight: 600; font-size: 15px; margin-top: 16px;">
          Come Back to MenoMind →
        </a>
        <p style="color: #999; font-size: 13px; margin-top: 32px; line-height: 1.5;">
          No pressure at all. This is a one-time offer and you can unsubscribe from these emails anytime.
        </p>
      </div>
    `,
  })
}
