import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM_EMAIL = 'MenoMind <hello@menomind.app>'
const REPLY_TO = 'midnight.chatter126@gmail.com'

interface SymptomTrend {
  name: string
  thisWeek: number
  lastWeek: number | null
  change: 'improved' | 'worsened' | 'stable' | 'new'
}

interface WeeklyInsightData {
  email: string
  name: string
  trends: SymptomTrend[]
  daysLogged: number
  topTip?: string
}

function formatTrendBadge(change: SymptomTrend['change']): string {
  switch (change) {
    case 'improved':
      return '<span style="color: #16a34a; font-weight: 600;">&#x2193; Improved</span>'
    case 'worsened':
      return '<span style="color: #dc2626; font-weight: 600;">&#x2191; Worsened</span>'
    case 'stable':
      return '<span style="color: #ca8a04; font-weight: 600;">&#x2194; Stable</span>'
    case 'new':
      return '<span style="color: #6B3F8D; font-weight: 600;">New</span>'
  }
}

export async function sendWeeklyInsight(data: WeeklyInsightData) {
  const { email, name, trends, daysLogged, topTip } = data

  const hasTrends = trends.length > 0

  const trendRows = trends
    .slice(0, 5)
    .map(
      (t) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px;">${t.name.replace(/_/g, ' ')}</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; text-align: center;">${t.thisWeek.toFixed(1)}/5</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; text-align: right;">${formatTrendBadge(t.change)}</td>
      </tr>`
    )
    .join('')

  const subject = hasTrends
    ? `Your weekly symptom check-in — ${trends.filter((t) => t.change === 'improved').length > 0 ? 'good news inside' : 'your patterns this week'}`
    : `Your weekly check-in — let's start tracking`

  const body = hasTrends
    ? `
      <p>Hi ${name},</p>
      <p>Here's your symptom snapshot for the past 7 days (you logged ${daysLogged} day${daysLogged !== 1 ? 's' : ''}):</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="text-align: left;">
            <th style="padding: 8px 0; border-bottom: 2px solid #6B3F8D; font-size: 13px; color: #666;">Symptom</th>
            <th style="padding: 8px 0; border-bottom: 2px solid #6B3F8D; font-size: 13px; color: #666; text-align: center;">Avg</th>
            <th style="padding: 8px 0; border-bottom: 2px solid #6B3F8D; font-size: 13px; color: #666; text-align: right;">Trend</th>
          </tr>
        </thead>
        <tbody>${trendRows}</tbody>
      </table>

      ${topTip ? `<div style="background: #F5F0F9; padding: 16px; border-radius: 8px; margin: 20px 0;"><p style="margin: 0; font-size: 14px;"><strong>This week's tip:</strong> ${topTip}</p></div>` : ''}

      <p style="font-size: 14px; color: #555;">The more consistently you log, the clearer your patterns become. Even a quick 30-second check-in makes a difference.</p>
    `
    : `
      <p>Hi ${name},</p>
      <p>It's been a week since you joined MenoMind, and we haven't seen any symptom logs yet. That's okay — starting is the hardest part.</p>

      <p>Here's why tracking matters: <strong>women who log symptoms for 2+ weeks are 3x more likely to identify patterns</strong> their doctor would otherwise miss. Things like "my anxiety always spikes on Tuesdays" or "brain fog is worst after poor sleep" become visible only with data.</p>

      <div style="background: #F5F0F9; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 0 0 8px; font-weight: 600;">Start with just 3 symptoms:</p>
        <p style="margin: 0; font-size: 14px; color: #555;">Pick the 3 symptoms that bother you most. Rate them 1-5 each day. It takes 30 seconds and the insights compound over time.</p>
      </div>
    `

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    replyTo: REPLY_TO,
    subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
        <div style="background: linear-gradient(135deg, #6B3F8D, #8B5AAF); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Your Weekly Check-In</h1>
        </div>
        <div style="padding: 32px; background: #fff;">
          ${body}
          <div style="text-align: center; margin: 28px 0;">
            <a href="https://menomind.app/track" style="background: #6B3F8D; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              ${hasTrends ? 'Log Today\'s Symptoms' : 'Start Tracking Now'}
            </a>
          </div>
          <p style="color: #666; font-size: 13px;">— The MenoMind Team</p>
        </div>
        <div style="padding: 16px 32px; background: #F5F0F9; text-align: center; font-size: 12px; color: #888; border-radius: 0 0 12px 12px;">
          <p><a href="https://www.menomind.app" style="color: #6B3F8D;">menomind.app</a></p>
          <p style="margin-top: 8px;"><a href="https://menomind.app/settings/subscription" style="color: #888;">Manage subscription</a></p>
        </div>
      </div>
    `,
  })
}
