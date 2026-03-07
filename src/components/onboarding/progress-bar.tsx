'use client';

import React from 'react';

export interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

function OnboardingProgressBar({ currentStep, totalSteps }: OnboardingProgressBarProps) {
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-brand-dark">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm text-gray-500">{percentage}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-purple to-brand-pink rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {/* Step dots */}
      <div className="flex items-center justify-between mt-3 px-1">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div
              key={stepNum}
              className={[
                'w-3 h-3 rounded-full transition-all duration-300',
                isCompleted
                  ? 'bg-brand-purple scale-100'
                  : isCurrent
                    ? 'bg-brand-pink scale-125 ring-2 ring-brand-pink/30'
                    : 'bg-gray-300 scale-100',
              ].join(' ')}
              aria-label={`Step ${stepNum}${isCompleted ? ' (completed)' : isCurrent ? ' (current)' : ''}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export { OnboardingProgressBar };
