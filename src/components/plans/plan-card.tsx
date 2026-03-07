'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

export type PlanStatus = 'active' | 'not_started' | 'locked';

export interface PlanCardData {
  type: string;
  title: string;
  description: string;
  icon: string;
  status: PlanStatus;
  progress?: number;
}

interface PlanCardProps {
  plan: PlanCardData;
  onGenerate: (type: string) => void;
  onView: (type: string) => void;
  generating?: boolean;
}

function PlanCard({ plan, onGenerate, onView, generating = false }: PlanCardProps) {
  const isLocked = plan.status === 'locked';
  const isActive = plan.status === 'active';

  return (
    <div
      className={`relative bg-white rounded-xl border shadow-sm overflow-hidden transition-all duration-150 ${
        isLocked
          ? 'border-gray-200 opacity-75'
          : 'border-gray-100 hover:shadow-md hover:border-brand-purple/30'
      }`}
    >
      {/* Lock overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <div className="text-center p-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600">Premium Feature</p>
            <p className="text-xs text-gray-400 mt-0.5">Upgrade to unlock</p>
          </div>
        </div>
      )}

      <div className="p-5">
        {/* Icon and title */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-brand-cream flex items-center justify-center text-2xl flex-shrink-0" aria-hidden="true">
            {plan.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-brand-dark">{plan.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{plan.description}</p>
          </div>
        </div>

        {/* Status badge */}
        <div className="mb-4">
          {isActive ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" aria-hidden="true" />
              Active
            </span>
          ) : !isLocked ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
              Not Started
            </span>
          ) : null}
        </div>

        {/* Progress bar (active plans only) */}
        {isActive && typeof plan.progress === 'number' && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">Progress</span>
              <span className="font-semibold text-brand-purple">{plan.progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-purple to-brand-pink rounded-full transition-all duration-500"
                style={{ width: `${plan.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {isActive ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onView(plan.type)}
              className="flex-1"
            >
              View Plan
            </Button>
          ) : !isLocked ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onGenerate(plan.type)}
              loading={generating}
              className="flex-1"
            >
              Generate Plan
            </Button>
          ) : (
            <Button variant="ghost" size="sm" disabled className="flex-1">
              Locked
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export { PlanCard };
