export interface SymptomInfo {
  explanation: string
  prevalence: number
}

export interface SymptomCategory {
  label: string
  icon: string
  symptoms: Record<string, SymptomInfo>
}

export type SymptomCategoryMap = Record<string, SymptomCategory>

export interface ActionPlan {
  title: string
  description: string
}

// Symptom category data for personalized results
export const SYMPTOM_CATEGORIES: SymptomCategoryMap = {
  cognitive: {
    label: 'Emotional & Cognitive',
    icon: '🧠',
    symptoms: {
      'Anxiety or panic attacks': {
        explanation: 'Hormonal fluctuations directly affect your nervous system. This is not "just stress."',
        prevalence: 62,
      },
      'Irritability or rage': {
        explanation: 'Estrogen drops affect serotonin regulation, causing intense emotional reactions that feel out of character.',
        prevalence: 70,
      },
      'Brain fog or memory issues': {
        explanation: 'Estrogen plays a key role in cognitive function. Many women describe feeling like they\'re "losing their mind."',
        prevalence: 60,
      },
      'Feeling down or emotionally flat': {
        explanation: 'Hormonal shifts can affect mood-regulating neurotransmitters, leading to emotional numbness or sadness.',
        prevalence: 45,
      },
    },
  },
  vasomotor: {
    label: 'Vasomotor Symptoms',
    icon: '🌡️',
    symptoms: {
      'Hot flashes': {
        explanation: 'Your body\'s thermostat is affected by changing estrogen levels, causing sudden waves of heat.',
        prevalence: 75,
      },
      'Night sweats': {
        explanation: 'The same temperature dysregulation that causes hot flashes intensifies during sleep.',
        prevalence: 68,
      },
      'Heart palpitations': {
        explanation: 'Estrogen fluctuations can affect heart rhythm. Often mistaken for anxiety or cardiac issues.',
        prevalence: 40,
      },
      'Dizziness': {
        explanation: 'Hormonal changes affect blood pressure regulation and inner ear function.',
        prevalence: 35,
      },
    },
  },
  somatic: {
    label: 'Physical & Sleep',
    icon: '😴',
    symptoms: {
      'Sleep disruption': {
        explanation: 'Progesterone — your natural sleep hormone — declines during perimenopause, disrupting your sleep architecture.',
        prevalence: 72,
      },
      'Fatigue / low energy': {
        explanation: 'Hormonal shifts affect your metabolism and energy production at a cellular level.',
        prevalence: 78,
      },
      'Joint or muscle pain': {
        explanation: 'Estrogen has anti-inflammatory properties. As levels drop, joint and muscle pain can increase.',
        prevalence: 55,
      },
      'Weight gain (especially midsection)': {
        explanation: 'Hormonal changes shift fat distribution and slow metabolism — this isn\'t about willpower.',
        prevalence: 65,
      },
    },
  },
  periods: {
    label: 'Menstrual Changes',
    icon: '📅',
    symptoms: {
      'Becoming irregular': {
        explanation: 'Irregular cycles are one of the earliest and most reliable signs of perimenopause.',
        prevalence: 80,
      },
      'Heavier or lighter than usual': {
        explanation: 'Fluctuating hormones cause unpredictable changes in menstrual flow.',
        prevalence: 65,
      },
      'Skipping months': {
        explanation: 'As ovulation becomes less regular, periods may come and go unpredictably.',
        prevalence: 50,
      },
      'Stopped completely': {
        explanation: 'If periods have stopped for 12+ consecutive months, you may have reached menopause.',
        prevalence: 30,
      },
    },
  },
}

// Personalized action plans based on symptom categories
export const ACTION_PLANS: Record<string, ActionPlan[]> = {
  cognitive: [
    { title: 'Daily mindfulness protocol for hormonal anxiety', description: 'A 10-minute evidence-based routine designed specifically for perimenopause-related anxiety.' },
    { title: 'Cognitive support nutrition guide', description: 'Foods and supplements that support brain function during hormonal transitions.' },
    { title: 'Stress-hormone balancing exercise plan', description: 'Movement patterns that reduce cortisol and support estrogen balance.' },
    { title: 'Sleep-mood connection optimization', description: 'How improving your sleep directly reduces anxiety and brain fog.' },
  ],
  vasomotor: [
    { title: 'Hot flash trigger identification protocol', description: 'Track and identify your personal triggers to reduce frequency by up to 40%.' },
    { title: 'Temperature regulation techniques', description: 'Evidence-based cooling strategies and breathing exercises for immediate relief.' },
    { title: 'Night sweat sleep environment guide', description: 'Optimize your sleep setup to minimize disruption from night sweats.' },
    { title: 'Dietary triggers elimination plan', description: 'Common foods that worsen vasomotor symptoms and what to eat instead.' },
  ],
  somatic: [
    { title: 'Evening wind-down protocol for hormonal sleep disruption', description: 'A step-by-step routine that works with your changing hormones, not against them.' },
    { title: 'Anti-inflammatory nutrition plan', description: 'Reduce joint pain and fatigue through targeted dietary changes.' },
    { title: 'Energy restoration exercise guide', description: 'Movement that boosts energy without overtaxing your system.' },
    { title: 'Weight management hormonal strategy', description: 'Why traditional diets fail in perimenopause and what actually works.' },
  ],
  general: [
    { title: 'Perimenopause symptom tracking starter guide', description: 'Learn what to track and how to spot patterns in your symptoms.' },
    { title: 'Doctor visit preparation checklist', description: 'Everything you need to advocate for yourself at your next appointment.' },
    { title: 'Hormone health daily routine', description: 'Morning and evening routines that support hormonal balance.' },
    { title: 'Perimenopause nutrition foundations', description: 'Key nutrients your body needs more of during this transition.' },
  ],
}
