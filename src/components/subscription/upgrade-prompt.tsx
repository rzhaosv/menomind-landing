'use client';

import React from 'react';
import { PricingModal } from './pricing-modal';

interface UpgradePromptProps {
  feature: string;
  onClose: () => void;
}

const CONTEXT_MAP: Record<string, { headline: string; body: string; icon: string }> = {
  unlimited_chat: {
    headline: 'Keep the conversation going',
    body: "You've asked great questions today. Unlock unlimited AI conversations to get personalized guidance anytime.",
    icon: '💬',
  },
  all_wellness_plans: {
    headline: 'Unlock your full wellness toolkit',
    body: 'Your nutrition plan is just the start. Get exercise, sleep, stress, and supplement plans tailored to your menopause stage.',
    icon: '🌿',
  },
  correlation_analysis: {
    headline: 'See the patterns in your symptoms',
    body: 'With enough data, our AI can identify what triggers your hot flashes, mood changes, and sleep issues.',
    icon: '📊',
  },
  export_report: {
    headline: 'Take this to your doctor',
    body: 'Generate a comprehensive symptom report to share with your healthcare provider at your next visit.',
    icon: '📋',
  },
};

function UpgradePrompt({ feature, onClose }: UpgradePromptProps) {
  // Try to match a known context key, otherwise use the feature text
  const context = CONTEXT_MAP[feature] || {
    headline: 'Unlock Premium Features',
    body: `Upgrade to access ${feature}. Get the full MenoMind experience with unlimited access to all tools.`,
    icon: '✨',
  };

  return (
    <PricingModal
      open
      onClose={onClose}
      context={context}
    />
  );
}

export { UpgradePrompt };
