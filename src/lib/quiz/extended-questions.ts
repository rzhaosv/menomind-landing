export interface QuizQuestion {
  id: string
  title: string
  subtitle?: string
  options: string[]
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
  {
    id: 'cognitive',
    title: 'What bothers you the most right now?',
    subtitle: 'Tap the one that fits best.',
    options: [
      'Anxiety, brain fog, or mood changes',
      'Hot flashes, night sweats, or heart racing',
      'Sleep problems, fatigue, or weight gain',
      'Period changes or pain',
      'Multiple symptoms — hard to pin down',
      "I'm not sure yet — I just want answers",
    ],
    type: 'single',
  },
  {
    id: 'age',
    title: 'How old are you?',
    subtitle: 'This helps us match your symptoms to the right patterns.',
    options: ['Under 35', '35-39', '40-44', '45-49', '50-54', '55+'],
    type: 'single',
  },
  {
    id: 'vasomotor',
    title: 'What about your body — anything feel off?',
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
  {
    id: 'timeline',
    title: 'When did you first notice something was off?',
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
]

// Education screen shown between core and depth questions
export const EDUCATION_SCREEN: EducationScreen = {
  id: 'education_1',
  type: 'education',
  headline: "You're not imagining this.",
  stat: 'The average woman sees 3+ doctors before getting a perimenopause diagnosis.',
  statSource: 'Biote Medical, 2023',
  body: "Most women experience symptoms for years before anyone connects the dots. That's not your fault — it's a gap in the system.",
  socialProof: '2,400+ women have taken this assessment this month',
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
  'Comparing with 2,400+ women in your age group...',
  'Identifying symptom patterns and connections...',
  'Matching your profile to clinical research...',
  'Checking for commonly missed correlations...',
  'Building your personalized assessment...',
]

// Full quiz flow as ordered screens
export function buildQuizScreens(): QuizScreen[] {
  const screens: QuizScreen[] = []

  // Screens 1-7: Core questions
  for (const q of CORE_QUESTIONS) {
    screens.push({ ...q, screenType: 'question' })
  }

  // Screen 8: Education break
  screens.push({ ...EDUCATION_SCREEN, screenType: 'education' })

  // Screens 9-11: Depth questions
  for (const q of DEPTH_QUESTIONS) {
    screens.push({ ...q, screenType: 'question' })
  }

  // Screen 12: Commitment
  screens.push({ ...COMMITMENT_SCREEN, screenType: 'commitment' })

  return screens
}
