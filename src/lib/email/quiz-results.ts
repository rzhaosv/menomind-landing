import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM_EMAIL = 'MenoMind <hello@menomind.app>'

interface QuizResultsEmailData {
  email: string
  symptoms: string[]
  level: string
  categories: string[]
}

export async function sendQuizResultsEmail(data: QuizResultsEmailData) {
  const token = Buffer.from(JSON.stringify({
    symptoms: data.symptoms,
    level: data.level,
    categories: data.categories,
  })).toString('base64url')

  const resultsUrl = `https://menomind.app/results?token=${token}`

  const symptomCount = data.symptoms.length
  const levelLabel = data.level === 'significant' ? 'significant' : data.level === 'moderate' ? 'moderate' : 'mild'

  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.email,
    subject: "Your MenoMind Assessment Results Are Ready",
    html: `
      <div style="font-family: Inter, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #6B3F8D, #D65C8C); margin-bottom: 12px;"></div>
          <h1 style="color: #1A1A2E; font-size: 22px; margin: 0;">Your Assessment Results</h1>
        </div>

        <p style="color: #1A1A2E; font-size: 16px; line-height: 1.6;">
          Based on your quiz, you reported <strong>${symptomCount} symptom${symptomCount !== 1 ? 's' : ''}</strong>
          at a <strong>${levelLabel}</strong> level. The good news? Every single one of these has a
          biological explanation — and there are things you can do about them.
        </p>

        <p style="color: #444; font-size: 15px; line-height: 1.6; margin-top: 16px;">
          We've put together your personalized results with explanations for each symptom
          and a recommended action plan.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${resultsUrl}"
             style="display: inline-block; background: #6B3F8D; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
            View Your Full Results →
          </a>
        </div>

        <p style="color: #888; font-size: 13px; line-height: 1.6; margin-top: 32px; border-top: 1px solid #eee; padding-top: 20px;">
          You're receiving this because you took the MenoMind symptom quiz.
          You can also <a href="https://menomind.app/try" style="color: #6B3F8D;">talk to our AI companion</a>
          about your symptoms — free, no account needed.
        </p>
      </div>
    `,
  })
}
