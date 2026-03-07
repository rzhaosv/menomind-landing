'use client';

import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface UpgradePromptProps {
  feature: string;
  onClose: () => void;
}

function UpgradePrompt({ feature, onClose }: UpgradePromptProps) {
  return (
    <Dialog open onClose={onClose} title="Upgrade to Premium">
      <div className="text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center mb-5">
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
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-brand-dark mb-2">
          Unlock Premium Features
        </h3>

        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Upgrade to access{' '}
          <span className="font-medium text-brand-dark">{feature}</span>.
          Get the full MenoMind experience with unlimited access to all tools.
        </p>

        {/* Pricing */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 border border-gray-200 rounded-xl p-4 hover:border-brand-purple transition-colors">
            <p className="text-xs text-gray-500 mb-1">Monthly</p>
            <p className="text-2xl font-bold text-brand-dark">
              $14.99
              <span className="text-sm font-normal text-gray-400">/mo</span>
            </p>
          </div>
          <div className="flex-1 border-2 border-brand-purple rounded-xl p-4 relative bg-brand-purple/5">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-brand-pink text-white text-[10px] font-semibold rounded-full">
              SAVE 45%
            </div>
            <p className="text-xs text-gray-500 mb-1">Yearly</p>
            <p className="text-2xl font-bold text-brand-dark">
              $99
              <span className="text-sm font-normal text-gray-400">/yr</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">~$8.25/mo</p>
          </div>
        </div>

        {/* Benefits list */}
        <ul className="text-left space-y-2 mb-6">
          {[
            'Unlimited AI chat conversations',
            'Full symptom history & trend analysis',
            'All 5 personalized wellness plans',
            'Priority support & new features',
          ].map((benefit) => (
            <li key={benefit} className="flex items-start gap-2 text-sm text-gray-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6B3F8D"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {benefit}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="space-y-3">
          <a href="/pricing" className="block">
            <Button variant="primary" size="lg" className="w-full">
              View Plans & Upgrade
            </Button>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export { UpgradePrompt };
