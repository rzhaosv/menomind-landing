'use client';

import React from 'react';

const SUGGESTED_PROMPTS = [
  { text: 'Why am I waking up at 3am?', icon: '🌙' },
  { text: 'What supplements help with hot flashes?', icon: '🌡️' },
  { text: 'Explain HRT pros and cons', icon: '💊' },
  { text: 'How can I manage brain fog at work?', icon: '🧠' },
  { text: 'Is my anxiety hormonal?', icon: '💭' },
] as const;

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
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
        How can I help you today?
      </h2>
      <p className="text-sm text-gray-500 mb-8 text-center max-w-md">
        Ask me anything about menopause, symptoms, treatments, or wellness. Choose a suggestion below or type your own question.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {SUGGESTED_PROMPTS.map((prompt) => (
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

export { SuggestedPrompts, SUGGESTED_PROMPTS };
