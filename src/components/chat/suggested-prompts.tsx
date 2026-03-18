'use client';

import React from 'react';

// Default prompts for users without onboarding data
const DEFAULT_PROMPTS = [
  { text: "I feel like I'm losing my mind and no one believes me", icon: '😶‍🌫️' },
  { text: 'I have this rage that comes out of nowhere', icon: '🔥' },
  { text: 'My doctor says nothing is wrong but I KNOW something is off', icon: '😤' },
  { text: 'I wake up at 3am drenched in sweat every night', icon: '🌙' },
  { text: 'Is this anxiety or is it hormonal?', icon: '💭' },
  { text: "I'm scared to try HRT — is it actually safe?", icon: '💊' },
];

// Symptom-specific prompts (matched to onboarding symptom IDs)
const SYMPTOM_PROMPTS: Record<string, { text: string; icon: string }[]> = {
  brain_fog: [
    { text: "Why is my brain fog worse in the afternoon?", icon: '🧠' },
    { text: "I keep forgetting words mid-sentence — is this normal?", icon: '😶‍🌫️' },
  ],
  anxiety: [
    { text: "My anxiety appeared out of nowhere at 42 — could it be hormonal?", icon: '💭' },
    { text: "I wake up with my heart racing and a sense of doom", icon: '😰' },
  ],
  hot_flashes: [
    { text: "What triggers hot flashes and how do I reduce them?", icon: '🔥' },
    { text: "My hot flashes are worse at night — what can I do?", icon: '🌡️' },
  ],
  night_sweats: [
    { text: "I wake up drenched in sweat — how do I stop this?", icon: '🌙' },
    { text: "Are night sweats dangerous or just uncomfortable?", icon: '💧' },
  ],
  sleep_disruption: [
    { text: "Why do I wake up at 3am every night?", icon: '🌙' },
    { text: "What can I do about hormonal insomnia?", icon: '😴' },
  ],
  mood_swings: [
    { text: "I have rage that comes out of nowhere — what's happening?", icon: '🔥' },
    { text: "Why do I feel emotionally flat and disconnected?", icon: '😶' },
  ],
  weight_gain: [
    { text: "Why am I gaining weight around my middle despite exercising?", icon: '⚖️' },
    { text: "Do I need to eat differently during perimenopause?", icon: '🥗' },
  ],
  joint_pain: [
    { text: "I feel like I'm 80 — is this joint pain hormonal?", icon: '🦴' },
    { text: "What helps with perimenopause joint stiffness?", icon: '💪' },
  ],
  fatigue: [
    { text: "I sleep 8 hours and still feel exhausted — why?", icon: '😮‍💨' },
    { text: "How do I get my energy back during perimenopause?", icon: '⚡' },
  ],
  irregular_periods: [
    { text: "My periods are all over the place — is this perimenopause?", icon: '📅' },
    { text: "How do I know if my cycle changes are normal?", icon: '🔄' },
  ],
  heart_palpitations: [
    { text: "My heart races for no reason — should I be worried?", icon: '💓' },
    { text: "Are heart palpitations a perimenopause symptom?", icon: '❤️' },
  ],
  low_libido: [
    { text: "Why has my sex drive completely disappeared?", icon: '💔' },
    { text: "Is there anything that helps with hormonal low libido?", icon: '💕' },
  ],
};

// General prompts that are always good
const GENERAL_PROMPTS = [
  { text: "What should I tell my doctor about my symptoms?", icon: '🩺' },
  { text: "Is HRT safe? I keep getting conflicting information", icon: '💊' },
  { text: "What supplements actually help during perimenopause?", icon: '🌿' },
  { text: "My doctor says nothing is wrong but I KNOW something is off", icon: '😤' },
];

function getPersonalizedPrompts(symptoms?: string[]): { text: string; icon: string }[] {
  if (!symptoms || symptoms.length === 0) return DEFAULT_PROMPTS;

  const prompts: { text: string; icon: string }[] = [];

  // Add one prompt per reported symptom (max 4)
  for (const symptom of symptoms) {
    const key = symptom.toLowerCase().replace(/[\s\/]+/g, '_');
    const matches = SYMPTOM_PROMPTS[key];
    if (matches && matches.length > 0) {
      // Pick one randomly to keep it fresh
      prompts.push(matches[Math.floor(Math.random() * matches.length)]);
    }
    if (prompts.length >= 4) break;
  }

  // Fill remaining slots with general prompts
  for (const gp of GENERAL_PROMPTS) {
    if (prompts.length >= 6) break;
    if (!prompts.some(p => p.text === gp.text)) {
      prompts.push(gp);
    }
  }

  // If still not enough, add defaults
  for (const dp of DEFAULT_PROMPTS) {
    if (prompts.length >= 6) break;
    if (!prompts.some(p => p.text === dp.text)) {
      prompts.push(dp);
    }
  }

  return prompts.slice(0, 6);
}

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  symptoms?: string[];
  userName?: string;
}

function SuggestedPrompts({ onSelect, symptoms, userName }: SuggestedPromptsProps) {
  const prompts = getPersonalizedPrompts(symptoms);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>

      <h2 className="text-xl font-semibold text-brand-dark mb-2">
        {userName ? `Hi ${userName} — what's on your mind?` : "What's been on your mind?"}
      </h2>
      <p className="text-sm text-gray-500 mb-8 text-center max-w-md">
        {symptoms && symptoms.length > 0
          ? "Based on your profile, here are some things we can explore together."
          : "Whatever you're experiencing, I've probably heard it before — and there's usually a reason for it."}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {prompts.map((prompt) => (
          <button
            key={prompt.text}
            type="button"
            onClick={() => onSelect(prompt.text)}
            className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-brand-purple hover:shadow-md transition-all duration-150 text-left group"
          >
            <span className="text-xl flex-shrink-0 mt-0.5" aria-hidden="true">
              {prompt.icon}
            </span>
            <span className="text-sm text-gray-700 group-hover:text-brand-purple transition-colors">
              {prompt.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export { SuggestedPrompts, SUGGESTED_PROMPTS, getPersonalizedPrompts };

// Keep backward compat
const SUGGESTED_PROMPTS = DEFAULT_PROMPTS;
