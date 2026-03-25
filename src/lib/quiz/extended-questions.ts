export interface QuizQuestion {
  id: string
  title: string
  subtitle?: string
  options: string[]
  icons?: string[] // Material Symbols icon names for each option
  type: 'single' | 'multi'
}

export interface EducationScreen {
  id: string
  type: 'education'
  headline: string
  stat: string
  statSource?: string
  body: string
  socialProof?: string
  cta?: string
}

export interface CommitmentScreen {
  id: string
  type: 'commitment'
  headline: string
  body: string
  buttonText: string
}

export type QuizScreen =
  | (QuizQuestion & { screenType: 'question' })
  | (EducationScreen & { screenType: 'education' })
  | (CommitmentScreen & { screenType: 'commitment' })

// Core symptom questions (existing, reformatted)
export const CORE_QUESTIONS: QuizQuestion[] = [
  // Q1: Symptom concern — validates the ad click, creates micro-commitment
  {
    id: 'primary_concern',
    title: "Which of these sounds like you right now?",
    subtitle: 'Tap the one that fits best.',
    options: [
      '\u{1F630} 3am anxiety that comes out of nowhere',
      '\u{1F32B}\uFE0F Brain fog \u2014 forgetting words mid-sentence',
      '\u{1F621} Rage or irritability that doesn\'t feel like "just stress"',
      '\u{1F634} Sleep problems \u2014 can\'t fall or stay asleep',
      '\u{1F493} Random heart palpitations or racing heart',
      '\u{1F937} Feeling unlike myself \u2014 but I can\'t explain it',
    ],
    type: 'single',
  },
  // Q2: Age — easy demographic, builds on commitment
  {
    id: 'age',
    title: 'How old are you?',
    subtitle: 'This helps us personalize your results.',
    options: ['Under 35', '35-39', '40-44', '45-49', '50-54', '55+'],
    type: 'single',
  },
  // Stage 2: Timeline (easy, builds narrative)
  {
    id: 'timeline',
    title: 'When did you first notice these changes?',
    subtitle: 'Even a rough estimate helps.',
    options: [
      'Last few weeks',
      '1-3 months ago',
      '3-12 months ago',
      '1-3 years ago',
      '3+ years ago',
    ],
    type: 'single',
  },
  // Stage 3: Symptom details (multi-select, user is now committed)
  {
    id: 'vasomotor',
    title: 'Have you noticed any of these?',
    subtitle: "Many women don't connect these to hormones at first.",
    options: [
      'Hot flashes',
      'Night sweats',
      'Heart palpitations',
      'Dizziness',
      'None of these',
    ],
    type: 'multi',
  },
  {
    id: 'somatic',
    title: 'How about sleep, energy, or pain?',
    subtitle: "If you're exhausted but can't explain why — you're not alone.",
    options: [
      'Sleep disruption',
      'Fatigue / low energy',
      'Joint or muscle pain',
      'Weight gain (especially midsection)',
      'None of these',
    ],
    type: 'multi',
  },
  {
    id: 'periods',
    title: 'Have your periods changed at all?',
    subtitle: 'Even subtle changes can be a signal.',
    options: [
      'Becoming irregular',
      'Heavier or lighter than usual',
      'Skipping months',
      'Stopped completely',
      'No changes',
    ],
    type: 'single',
  },
  // Stage 4: Deeper context
  {
    id: 'history',
    title: 'Do you know if anyone in your family went through menopause early?',
    subtitle: "It's okay if you're not sure — most women don't know.",
    options: ['Yes', 'No', "I'm not sure"],
    type: 'single',
  },
  {
    id: 'impact',
    title: "How much is all of this affecting your day-to-day?",
    subtitle: "Be honest — there's no wrong answer here.",
    options: [
      'Not really — just curious',
      'A little — I can manage, but I notice it',
      "A lot — it's affecting my work or relationships",
      "It's overwhelming — I don't feel like myself",
    ],
    type: 'single',
  },
]

// Depth questions (new)
export const DEPTH_QUESTIONS: QuizQuestion[] = [
  {
    id: 'goals',
    title: 'What matters most to you right now?',
    subtitle: "This helps us personalize your plan.",
    options: [
      'Understanding what\'s happening to my body',
      'Managing specific symptoms',
      'Preparing for a doctor conversation',
      'Finding other women going through this',
      'All of the above',
    ],
    type: 'multi',
  },
  {
    id: 'tried',
    title: "What have you tried so far?",
    subtitle: "No judgment — most women feel lost at first.",
    options: [
      'Googled my symptoms',
      'Talked to my doctor',
      'Supplements or vitamins',
      'Hormone therapy (HRT)',
      'Nothing yet — just starting to look into it',
    ],
    type: 'multi',
  },
]

// Education screen shown after age question (normalizes symptoms before asking about them)
export const EARLY_EDUCATION_SCREEN: EducationScreen = {
  id: 'education_early',
  type: 'education',
  headline: "Everyone warned you about hot flashes.",
  stat: '',
  body: "Nobody mentioned the 3am anxiety. The rage that comes from nowhere. Forgetting a word mid-sentence and calling the refrigerator \u2018the cold food box.\u2019 These aren\u2019t stress. These aren\u2019t aging. They\u2019re hormonal \u2014 and more common than hot flashes.",
  cta: "That sounds familiar \u2192",
}

// Education screen shown between core and depth questions
export const EDUCATION_SCREEN: EducationScreen = {
  id: 'education_1',
  type: 'education',
  headline: "Your tests came back \u2018normal.\u2019 You\u2019re not imagining it.",
  stat: '',
  body: "The average woman visits her doctor 3\u20134 times before anyone mentions perimenopause. Standard lab tests often miss hormonal fluctuation entirely. You\u2019re not crazy. You\u2019re not anxious. Your body is changing \u2014 and there\u2019s a name for it.",
  cta: "Keep going \u2192",
}

// Commitment screen shown after depth questions
export const COMMITMENT_SCREEN: CommitmentScreen = {
  id: 'commitment',
  type: 'commitment',
  headline: "Ready to see what's really going on?",
  body: "We've analyzed thousands of symptom profiles. In the next 30 seconds, you'll see exactly how your symptoms connect — and what you can do about it.",
  buttonText: "Show Me My Results",
}

// Analyzing screen messages
export const ANALYZING_MESSAGES = [
  'Reviewing your symptom pattern...',
  'Comparing to 14,000+ women like you...',
  'Building your personalized report...',
]

// Full quiz flow as ordered screens
export function buildQuizScreens(): QuizScreen[] {
  const screens: QuizScreen[] = []

  // Q1: Primary concern (symptom selector — validates ad click)
  screens.push({ ...CORE_QUESTIONS[0], screenType: 'question' })

  // Q2: Age
  screens.push({ ...CORE_QUESTIONS[1], screenType: 'question' })

  // Education interstitial after age (normalizes symptoms)
  screens.push({ ...EARLY_EDUCATION_SCREEN, screenType: 'education' })

  // Q3: timeline, Q4: vasomotor, Q5: somatic
  for (let i = 2; i <= 4; i++) {
    screens.push({ ...CORE_QUESTIONS[i], screenType: 'question' })
  }

  // Second education interstitial (after somatic symptoms)
  screens.push({ ...EDUCATION_SCREEN, screenType: 'education' })

  // Q6+: periods, history, impact
  for (let i = 5; i < CORE_QUESTIONS.length; i++) {
    screens.push({ ...CORE_QUESTIONS[i], screenType: 'question' })
  }

  // Screens 9-11: Depth questions
  for (const q of DEPTH_QUESTIONS) {
    screens.push({ ...q, screenType: 'question' })
  }

  // Screen 12: Commitment
  screens.push({ ...COMMITMENT_SCREEN, screenType: 'commitment' })

  return screens
}
