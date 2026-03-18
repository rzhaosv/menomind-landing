'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingProgressBar } from '@/components/onboarding/progress-bar';
import { Button } from '@/components/ui/button';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type MenopauseStage =
  | 'pre-menopause'
  | 'perimenopause'
  | 'post-menopause'
  | 'not-sure';

interface OnboardingData {
  yearBorn: string;
  menopauseStage: MenopauseStage | '';
  symptoms: string[];
  healthConditions: string[];
  medications: string;
  goals: string[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TOTAL_STEPS = 7;

const SYMPTOM_OPTIONS = [
  'Hot flashes',
  'Night sweats',
  'Sleep problems',
  'Mood changes',
  'Brain fog',
  'Fatigue',
  'Joint pain',
  'Weight changes',
  'Irregular periods',
  'Low libido',
  'Anxiety',
  'Heart palpitations',
] as const;

const SYMPTOM_ICONS: Record<string, string> = {
  'Hot flashes': 'M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 6.75 6.75 0 009 15a6.75 6.75 0 006.362-9.786z',
  'Night sweats': 'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z',
  'Sleep problems': 'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z',
  'Mood changes': 'M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z',
  'Brain fog': 'M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z',
  'Fatigue': 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
  'Joint pain': 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  'Weight changes': 'M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z',
  'Irregular periods': 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
  'Low libido': 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
  'Anxiety': 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
  'Heart palpitations': 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
};

const HEALTH_CONDITION_OPTIONS = [
  'High blood pressure',
  'Diabetes',
  'Thyroid condition',
  'Heart disease',
  'Osteoporosis',
  'Depression',
  'Breast cancer history',
  'Blood clotting disorder',
  'Migraines',
  'Endometriosis',
] as const;

const GOAL_OPTIONS = [
  { id: 'understand-symptoms', label: 'Understand my symptoms', icon: 'M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18' },
  { id: 'manage-hot-flashes', label: 'Manage hot flashes', icon: 'M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 6.75 6.75 0 009 15a6.75 6.75 0 006.362-9.786z' },
  { id: 'improve-sleep', label: 'Improve sleep', icon: 'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z' },
  { id: 'boost-mood', label: 'Boost mood & energy', icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z' },
  { id: 'nutrition', label: 'Nutrition guidance', icon: 'M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265z' },
  { id: 'exercise', label: 'Exercise recommendations', icon: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z' },
  { id: 'learn-hrt', label: 'Learn about HRT', icon: 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5' },
  { id: 'doctor-prep', label: 'Prepare for doctor visits', icon: 'M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75' },
] as const;

const BENEFITS = [
  { text: 'Understand why your body is doing what it\'s doing', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
  { text: 'Get a plan that actually makes sense for your symptoms', icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z' },
  { text: 'Real answers backed by science, not guesswork', icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' },
] as const;

/* ------------------------------------------------------------------ */
/*  Inline SVG icon helper                                             */
/* ------------------------------------------------------------------ */

function HeroIcon({ d, className = 'w-6 h-6' }: { d: string; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Year options                                                       */
/* ------------------------------------------------------------------ */

function generateYearOptions() {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear - 18; y >= currentYear - 85; y--) {
    years.push(y);
  }
  return years;
}

const YEAR_OPTIONS = generateYearOptions();

/* ------------------------------------------------------------------ */
/*  Step components                                                    */
/* ------------------------------------------------------------------ */

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center max-w-lg mx-auto">
      {/* Logo / icon */}
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="white"
          className="w-10 h-10"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
          />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-brand-dark mb-3">
        Finally, someone who gets it
      </h1>
      <p className="text-gray-600 mb-8 text-lg">
        Let&apos;s figure out what&apos;s going on with your body. Takes about 2 minutes.
      </p>

      <div className="space-y-4 mb-10 text-left">
        {BENEFITS.map((benefit) => (
          <div
            key={benefit.text}
            className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-purple/10 flex items-center justify-center text-brand-purple">
              <HeroIcon d={benefit.icon} className="w-5 h-5" />
            </div>
            <p className="text-brand-dark font-medium pt-1.5">{benefit.text}</p>
          </div>
        ))}
      </div>

      <Button size="lg" onClick={onNext} className="w-full sm:w-auto min-w-[200px]">
        Get Started
      </Button>
    </div>
  );
}

function StepAgeStage({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const stages: { value: MenopauseStage; label: string; description: string }[] = [
    { value: 'pre-menopause', label: 'Pre-menopause', description: 'Regular periods, no symptoms yet' },
    { value: 'perimenopause', label: 'Perimenopause', description: 'Irregular periods, experiencing symptoms' },
    { value: 'post-menopause', label: 'Post-menopause', description: 'No period for 12+ months' },
    { value: 'not-sure', label: 'Not sure', description: 'I\'m not certain which stage I\'m in' },
  ];

  const canProceed = data.yearBorn !== '' && data.menopauseStage !== '';

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-brand-dark mb-2">
        Age &amp; Stage
      </h2>
      <p className="text-gray-600 mb-8">
        Help us understand where you are in your journey.
      </p>

      {/* Year born */}
      <div className="mb-8">
        <label htmlFor="year-born" className="block text-sm font-semibold text-brand-dark mb-2">
          Year of birth
        </label>
        <select
          id="year-born"
          value={data.yearBorn}
          onChange={(e) => onChange({ yearBorn: e.target.value })}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-brand-dark focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple outline-none transition-colors"
        >
          <option value="">Select year</option>
          {YEAR_OPTIONS.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Menopause stage */}
      <div className="mb-8">
        <p className="text-sm font-semibold text-brand-dark mb-3">
          What stage best describes you?
        </p>
        <div className="space-y-3">
          {stages.map((stage) => (
            <label
              key={stage.value}
              className={[
                'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                data.menopauseStage === stage.value
                  ? 'border-brand-purple bg-brand-purple/5'
                  : 'border-gray-200 hover:border-gray-300 bg-white',
              ].join(' ')}
            >
              <input
                type="radio"
                name="menopause-stage"
                value={stage.value}
                checked={data.menopauseStage === stage.value}
                onChange={() => onChange({ menopauseStage: stage.value })}
                className="mt-1 accent-brand-purple"
              />
              <div>
                <span className="font-medium text-brand-dark">{stage.label}</span>
                <p className="text-sm text-gray-500 mt-0.5">{stage.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
}

function StepSymptoms({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const toggleSymptom = (symptom: string) => {
    const current = data.symptoms;
    const updated = current.includes(symptom)
      ? current.filter((s) => s !== symptom)
      : [...current, symptom];
    onChange({ symptoms: updated });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-brand-dark mb-2">
        What&apos;s been going on?
      </h2>
      <p className="text-gray-600 mb-8">
        Select everything that feels familiar. There are no wrong answers — most women are dealing with more of these than they realize.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {SYMPTOM_OPTIONS.map((symptom) => {
          const selected = data.symptoms.includes(symptom);
          const iconPath = SYMPTOM_ICONS[symptom];
          return (
            <button
              key={symptom}
              type="button"
              onClick={() => toggleSymptom(symptom)}
              className={[
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center',
                selected
                  ? 'border-brand-purple bg-brand-purple/5 text-brand-purple'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
              ].join(' ')}
              aria-pressed={selected}
            >
              {iconPath && (
                <HeroIcon
                  d={iconPath}
                  className={`w-6 h-6 ${selected ? 'text-brand-purple' : 'text-gray-400'}`}
                />
              )}
              <span className="text-sm font-medium">{symptom}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={data.symptoms.length === 0} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
}

function StepHealth({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const toggleCondition = (condition: string) => {
    const current = data.healthConditions;
    const updated = current.includes(condition)
      ? current.filter((c) => c !== condition)
      : [...current, condition];
    onChange({ healthConditions: updated });
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-brand-dark mb-2">
        Health History
      </h2>
      <p className="text-gray-600 mb-8">
        This helps us give safer, more relevant guidance. This step is optional.
      </p>

      {/* Health conditions */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-brand-dark mb-3">
          Any existing health conditions?
        </p>
        <div className="flex flex-wrap gap-2">
          {HEALTH_CONDITION_OPTIONS.map((condition) => {
            const selected = data.healthConditions.includes(condition);
            return (
              <button
                key={condition}
                type="button"
                onClick={() => toggleCondition(condition)}
                className={[
                  'px-4 py-2 rounded-full text-sm font-medium border transition-all',
                  selected
                    ? 'bg-brand-purple text-white border-brand-purple'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400',
                ].join(' ')}
                aria-pressed={selected}
              >
                {condition}
              </button>
            );
          })}
        </div>
      </div>

      {/* Medications */}
      <div className="mb-8">
        <label htmlFor="medications" className="block text-sm font-semibold text-brand-dark mb-2">
          Current medications (optional)
        </label>
        <textarea
          id="medications"
          value={data.medications}
          onChange={(e) => onChange({ medications: e.target.value })}
          placeholder="e.g. Levothyroxine, Vitamin D supplements..."
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-brand-dark placeholder:text-gray-400 focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple outline-none transition-colors resize-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Continue
        </Button>
      </div>
      <button
        type="button"
        onClick={onNext}
        className="w-full mt-3 text-sm text-gray-500 hover:text-brand-purple transition-colors underline"
      >
        Skip this step
      </button>
    </div>
  );
}

function StepGoals({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: OnboardingData;
  onChange: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const toggleGoal = (goalId: string) => {
    const current = data.goals;
    const updated = current.includes(goalId)
      ? current.filter((g) => g !== goalId)
      : [...current, goalId];
    onChange({ goals: updated });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-brand-dark mb-2">
        What matters most to you right now?
      </h2>
      <p className="text-gray-600 mb-8">
        Pick the things that would make the biggest difference in your daily life.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {GOAL_OPTIONS.map((goal) => {
          const selected = data.goals.includes(goal.id);
          return (
            <button
              key={goal.id}
              type="button"
              onClick={() => toggleGoal(goal.id)}
              className={[
                'flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left',
                selected
                  ? 'border-brand-purple bg-brand-purple/5'
                  : 'border-gray-200 bg-white hover:border-gray-300',
              ].join(' ')}
              aria-pressed={selected}
            >
              <div
                className={[
                  'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                  selected ? 'bg-brand-purple/10 text-brand-purple' : 'bg-gray-100 text-gray-500',
                ].join(' ')}
              >
                <HeroIcon d={goal.icon} className="w-5 h-5" />
              </div>
              <span
                className={[
                  'font-medium text-sm',
                  selected ? 'text-brand-purple' : 'text-brand-dark',
                ].join(' ')}
              >
                {goal.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={data.goals.length === 0} className="flex-1">
          Create My Plan
        </Button>
      </div>
    </div>
  );
}

function StepGenerating({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <div className="text-center max-w-md mx-auto py-12">
      {error ? (
        <>
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-brand-dark mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={onRetry}>Try Again</Button>
        </>
      ) : (
        <>
          {/* Animated loader */}
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
            <div className="absolute inset-0 rounded-full border-4 border-brand-purple border-t-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-brand-purple/10 to-brand-pink/10 flex items-center justify-center">
              <HeroIcon
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                className="w-7 h-7 text-brand-purple animate-pulse"
              />
            </div>
          </div>

          <h2 className="text-xl font-bold text-brand-dark mb-2">
            Creating your personalized plan...
          </h2>
          <p className="text-gray-500 mb-8">
            We&apos;re analyzing your symptoms and goals to build a plan just for you.
          </p>

          {/* Progress steps */}
          <div className="space-y-3 text-left max-w-xs mx-auto">
            {[
              'Understanding your symptoms',
              'Finding what actually works for your situation',
              'Putting your plan together',
            ].map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full bg-brand-purple/20 flex items-center justify-center animate-pulse"
                  style={{ animationDelay: `${i * 0.5}s` }}
                >
                  <div className="w-2 h-2 rounded-full bg-brand-purple" />
                </div>
                <span className="text-sm text-gray-600">{step}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StepComplete({
  data,
  onStartChat,
}: {
  data: OnboardingData;
  onStartChat: () => void;
}) {
  const symptomCount = data.symptoms.length;
  const goalCount = data.goals.length;

  return (
    <div className="max-w-lg mx-auto text-center">
      {/* Success icon */}
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-10 h-10" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-brand-dark mb-2">
        Good news — there&apos;s a lot we can do.
      </h2>
      <p className="text-gray-600 mb-6">
        Based on what you told us, we&apos;ve put together a plan that addresses your {symptomCount} symptom{symptomCount !== 1 ? 's' : ''} and {goalCount} goal{goalCount !== 1 ? 's' : ''}. Your AI companion already knows your context and is ready to help.
      </p>

      {/* What they get */}
      <div className="bg-brand-purple/5 border-2 border-brand-purple/20 rounded-2xl p-6 mb-6 text-left">
        <p className="text-sm font-bold text-brand-purple mb-3 uppercase tracking-wide">
          What&apos;s ready for you
        </p>
        <ul className="space-y-2.5">
          {[
            'AI companion that knows your symptoms & goals',
            'Personalized wellness plan based on your profile',
            'Daily symptom tracking & trend analysis',
            '5 free AI conversations per day',
          ].map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B3F8D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Primary CTA */}
      <Button
        size="lg"
        onClick={onStartChat}
        className="w-full bg-gradient-to-r from-brand-purple to-brand-pink hover:from-brand-purple-dark hover:to-brand-pink text-white"
      >
        Go to Your Dashboard
      </Button>

      <p className="text-xs text-gray-400 mt-3">
        Your personalized plan is ready
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');

  const [data, setData] = useState<OnboardingData>({
    yearBorn: '',
    menopauseStage: '',
    symptoms: [],
    healthConditions: [],
    medications: '',
    goals: [],
  });

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const goNext = useCallback(() => {
    setSlideDirection('left');
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }, []);

  const goBack = useCallback(() => {
    setSlideDirection('right');
    setCurrentStep((s) => Math.max(s - 1, 1));
  }, []);

  const submitOnboarding = useCallback(async () => {
    setSubmitting(true);
    setError(null);

    try {
      // Save profile data
      const profileRes = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year_born: data.yearBorn ? parseInt(data.yearBorn, 10) : null,
          menopause_stage: data.menopauseStage || null,
          symptoms: data.symptoms,
          health_conditions: data.healthConditions,
          medications: data.medications || null,
          goals: data.goals,
          onboarding_completed: true,
        }),
      });

      if (!profileRes.ok) {
        const body = await profileRes.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to save your profile. Please try again.');
      }

      // Generate initial wellness plan
      const planRes = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: data.symptoms,
          goals: data.goals,
          menopause_stage: data.menopauseStage,
        }),
      });

      if (!planRes.ok) {
        // Non-fatal: plan generation can fail but onboarding is complete
        console.error('Plan generation failed, continuing to dashboard');
      }

      // Go to premium offer step instead of dashboard
      setSlideDirection('left');
      setCurrentStep(TOTAL_STEPS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setSubmitting(false);
    }
  }, [data]);

  // Auto-submit when reaching the final step
  const handleGoToGenerating = useCallback(() => {
    setSlideDirection('left');
    setCurrentStep(TOTAL_STEPS - 1); // Go to generating step (6)
    // Submit after a short delay so the UI updates first
    setTimeout(() => {
      submitOnboarding();
    }, 500);
  }, [submitOnboarding]);

  const handleRetry = useCallback(() => {
    submitOnboarding();
  }, [submitOnboarding]);

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col">
      {/* Progress bar - hide on welcome and generating steps */}
      {currentStep > 1 && currentStep < TOTAL_STEPS - 1 && (
        <div className="max-w-2xl mx-auto w-full px-4">
          <OnboardingProgressBar currentStep={currentStep - 1} totalSteps={TOTAL_STEPS - 3} />
        </div>
      )}

      {/* Step content with slide animation */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div
          key={currentStep}
          className={[
            'w-full animate-fade-slide-in',
            slideDirection === 'left' ? 'motion-safe:animate-slide-in-left' : 'motion-safe:animate-slide-in-right',
          ].join(' ')}
          style={{
            animation: 'fadeSlideIn 0.3s ease-out',
          }}
        >
          {currentStep === 1 && <StepWelcome onNext={goNext} />}
          {currentStep === 2 && (
            <StepAgeStage data={data} onChange={updateData} onNext={goNext} onBack={goBack} />
          )}
          {currentStep === 3 && (
            <StepSymptoms data={data} onChange={updateData} onNext={goNext} onBack={goBack} />
          )}
          {currentStep === 4 && (
            <StepHealth data={data} onChange={updateData} onNext={goNext} onBack={goBack} />
          )}
          {currentStep === 5 && (
            <StepGoals data={data} onChange={updateData} onNext={handleGoToGenerating} onBack={goBack} />
          )}
          {currentStep === 6 && (
            <StepGenerating error={error} onRetry={handleRetry} />
          )}
          {currentStep === 7 && (
            <StepComplete data={data} onStartChat={() => router.push('/dashboard')} />
          )}
        </div>
      </div>

      {/* Inline keyframes for slide animation */}
      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateX(${slideDirection === 'left' ? '24px' : '-24px'});
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
