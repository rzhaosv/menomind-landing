# Claude Code Prompt: Phase 2 — Results Page, Email Flow, Remaining Wiring

Copy everything below the line and paste it into Claude Code as a single prompt. This continues from Phase 1 which created the `/try` page, anonymous chat API, email capture component, recognition-first system prompt, and landing page copy improvements. Those files are DONE — do NOT modify them.

---

Phase 1 created the anonymous chat flow and updated all landing page copy (quiz questions, results messages, hero, CTAs, etc). But there's a gap: when someone enters their email on the quiz results page, we capture it in the database but never actually send them an email. And there's no `/results` page for email links to point to. This prompt fixes the email → results → chat pipeline.

The conversion strategy: quiz → free results on-page → email capture ("I'll check in with you in a few days") → email with results summary + link to `/results?token=...` → results page bridges to `/try` (AI chat) → she comes back.

Read each file fully before modifying. Go one file at a time.

---

## PART 1: SHARED QUIZ DATA — already extracted, verify it's correct

### File: `src/lib/quiz/symptom-data.ts`

This file should already exist with `SYMPTOM_CATEGORIES` and `ACTION_PLANS` exported from it. The landing page already imports from `@/lib/quiz/symptom-data`. Read it and verify the types are clean. If it's missing TypeScript types, add them:

```typescript
export interface SymptomInfo {
  explanation: string
  prevalence: number
}

export interface SymptomCategory {
  label: string
  icon: string
  symptoms: Record<string, SymptomInfo>
}

export interface ActionPlan {
  title: string
  description: string
}
```

If the file doesn't exist for some reason, extract `SYMPTOM_CATEGORIES` and `ACTION_PLANS` from `src/components/landing/landing-page.tsx` into this file with proper types.

---

## PART 2: QUIZ RESULTS PAGE

### Create: `src/app/(public)/results/page.tsx`

This is the page that email recipients land on when they click "View Your Full Results." It reads quiz data from a base64 token in the URL, shows personalized results, and bridges to the AI chat.

**URL format**: `/results?token=<base64url-encoded-JSON>`

The token contains: `{ symptoms: string[], level: string, categories: string[] }`

This is a **stateless** approach — no database lookup needed, no auth required. The token is generated when we send the email and contains everything needed to render results.

The page should:

1. Be a `'use client'` component wrapped in `<Suspense>` (since it uses `useSearchParams()`).
2. Parse the `token` query param — `JSON.parse(atob(token))` with try/catch error handling. Use `Buffer.from(token, 'base64url').toString()` if available, or `decodeURIComponent(atob(token))`.
3. If no token or invalid token: show a friendly fallback: "Hmm, we couldn't load your results. Want to take the quiz?" → link to landing page `/#quiz`.
4. If valid token, render:

**Header** — Same minimal header as `/try` page: MenoMind logo + "Create free account" link.

**Section 1: Result Summary**
- Headline: "Here's what we found"
- Subhead: "Based on your symptom quiz"
- Assessment level badge using the `level` from the token, with the same recognition-first messages used on the landing page:
  - `low`: "Your symptoms are mild right now, but the fact that you're here means you're listening to your body. That matters."
  - `moderate`: "What you're describing is incredibly common in women your age, and there's a real biological reason for it. You're not stressed, broken, or imagining things."
  - `strong`: "Everything you're feeling makes sense. This isn't anxiety, it isn't burnout, and you're definitely not losing your mind."

**Section 2: Symptom Breakdown**
- Header: "Why you're feeling this way"
- Subheader: "Every one of these has a biological explanation."
- For each symptom in the token, look up its data from `SYMPTOM_CATEGORIES` (imported from `@/lib/quiz/symptom-data`).
- Show symptom name, explanation, prevalence. Group by category.

**Section 3: Action Plan**
- Header: "What you can actually do about it"
- Pull relevant plans from `ACTION_PLANS` based on the categories in the token.
- Show ALL plans — no locks or premium overlays.
- After the list: "Your AI companion can walk you through each of these step by step →" linking to `/try?symptoms=...&level=...`

**Section 4: Primary CTA**
- Big button: "Talk to Your AI Companion About These Results" → `/try?symptoms=${encodeURIComponent(symptoms.join(','))}&level=${level}`
- Subtitle: "Free · No account needed · Get personalized answers now"

**Section 5: Secondary CTA**
- "Not ready to chat? Create a free account to save your results."
- Link to `/signup`

**Design:** Clean, mobile-first, matches brand (soft purples). No app shell. Simple footer.

---

## PART 3: QUIZ RESULTS EMAIL

### Create: `src/lib/email/quiz-results.ts`

A new file (NOT modifying resend.ts) with the email function:

```typescript
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
  const levelLabel = data.level === 'strong' ? 'significant' : data.level === 'moderate' ? 'moderate' : 'mild'

  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.email,
    subject: "Your MenoMind Assessment Results",
    html: `
      <div style="font-family: Inter, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #6B3F8D, #D65C8C);"></div>
          <h1 style="color: #1A1A2E; font-size: 22px; margin: 12px 0 0;">Your Results Are Ready</h1>
        </div>

        <p style="color: #1A1A2E; font-size: 16px; line-height: 1.6;">
          You reported <strong>${symptomCount} symptom${symptomCount !== 1 ? 's' : ''}</strong>
          at a <strong>${levelLabel}</strong> level. Every single one of these has a
          biological explanation — and there are real things you can do about them.
        </p>

        <p style="color: #444; font-size: 15px; line-height: 1.6; margin-top: 16px;">
          We've put together your personalized breakdown with explanations for each symptom
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
```

### Modify: `src/app/api/waitlist/checkin/route.ts`

Read this file. It currently stores email + quiz data in Supabase but does NOT send any email. After the upsert succeeds, add a call to `sendQuizResultsEmail()`.

Import `sendQuizResultsEmail` from `@/lib/email/quiz-results` and `SYMPTOM_CATEGORIES` from `@/lib/quiz/symptom-data`.

After the successful Supabase upsert:

```typescript
// Determine categories from symptoms
const categories: string[] = []
if (quizSymptoms && quizSymptoms.length > 0) {
  for (const [catKey, catData] of Object.entries(SYMPTOM_CATEGORIES)) {
    const catSymptomNames = Object.keys(catData.symptoms)
    if (quizSymptoms.some((s: string) => catSymptomNames.includes(s))) {
      categories.push(catKey)
    }
  }
}

// Send results email (non-blocking — don't fail the request if email fails)
try {
  await sendQuizResultsEmail({
    email,
    symptoms: quizSymptoms || [],
    level: quizLevel || 'unknown',
    categories,
  })
} catch (emailError) {
  console.error('Failed to send quiz results email:', emailError)
}
```

---

## PART 4: DATABASE MIGRATION

### Create: `supabase/migrations/20260311_checkin_signups.sql`

Check if a `supabase/migrations` folder exists. If not, create it.

```sql
-- Email capture for anonymous quiz users
create table if not exists public.checkin_signups (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  anonymous_session_id text,
  quiz_symptoms text[],
  quiz_level text,
  quiz_categories text[],
  created_at timestamptz default now(),
  followed_up boolean default false,
  converted_to_user boolean default false
);

-- Upsert index on email
create unique index if not exists checkin_signups_email_idx on public.checkin_signups (email);

-- RLS enabled but no policies = server-only access
alter table public.checkin_signups enable row level security;
```

---

## FILES TO CREATE (new):
1. `src/app/(public)/results/page.tsx` — Quiz results page (email CTA links here)
2. `src/lib/email/quiz-results.ts` — Quiz results email sender function
3. `supabase/migrations/20260311_checkin_signups.sql` — Database migration

## FILES TO MODIFY:
1. `src/app/api/waitlist/checkin/route.ts` — Wire email sending after Supabase save
2. `src/lib/quiz/symptom-data.ts` — Verify types exist, add if missing

## FILES TO NOT MODIFY (already done):
- `src/lib/ai/system-prompt.ts` — Recognition-first prompt done in Phase 1
- `src/app/api/chat/anonymous/route.ts` — Anonymous chat done in Phase 1
- `src/components/chat/email-capture-prompt.tsx` — Done in Phase 1
- `src/components/chat/chat-interface.tsx` — Anonymous mode done in Phase 1
- `src/app/(public)/try/page.tsx` — Anonymous chat page done in Phase 1
- `src/app/(app)/onboarding/page.tsx` — StepComplete done in Phase 1
- `src/components/landing/landing-page.tsx` — All copy, CTAs, email capture, and quiz improvements done. DO NOT TOUCH.
- `src/lib/email/resend.ts` — Keep existing email functions unchanged

## IMPLEMENTATION ORDER:
1. `src/lib/quiz/symptom-data.ts` — Verify/fix types
2. `src/lib/email/quiz-results.ts` — Create email function
3. `src/app/api/waitlist/checkin/route.ts` — Wire email sending
4. `src/app/(public)/results/page.tsx` — Create results page
5. `supabase/migrations/20260311_checkin_signups.sql` — Create migration

Go file by file. Read each file fully before modifying. Don't rush.
