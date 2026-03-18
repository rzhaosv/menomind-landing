import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export interface PlanAction {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  category?: string | null;
}

export interface PlanActionsProps {
  planName: string | null;
  actions: PlanAction[];
}

function getCategoryIcon(category: string | null | undefined): string {
  switch (category) {
    case 'nutrition':
      return 'M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265z';
    case 'exercise':
      return 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z';
    case 'mindfulness':
      return 'M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18';
    case 'sleep':
      return 'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z';
    default:
      return 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z';
  }
}

function PlanActions({ planName, actions }: PlanActionsProps) {
  const completedCount = actions.filter((a) => a.completed).length;
  const totalCount = actions.length;

  if (!planName || actions.length === 0) {
    return (
      <Card className="border-2 border-brand-purple/15 bg-gradient-to-br from-brand-purple/[0.03] to-brand-pink/[0.03]">
        <CardHeader>
          <CardTitle>Today&apos;s Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-purple/10 flex items-center justify-center">
              <span className="text-xl">📋</span>
            </div>
            <p className="text-sm font-medium text-brand-dark mb-1">
              Get your personalized wellness plan
            </p>
            <p className="text-xs text-gray-500 mb-4">
              AI-generated action items for nutrition, sleep, exercise, and stress — tailored to your symptoms.
            </p>
            <Link
              href="/plans"
              className="inline-block bg-brand-purple text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-purple-dark transition-colors"
            >
              Generate My Plan
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>{planName}</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            {completedCount} of {totalCount} actions completed
          </p>
        </div>
        {/* Circular progress indicator */}
        <div className="flex-shrink-0">
          <svg width={40} height={40} viewBox="0 0 40 40" aria-hidden="true">
            <circle cx={20} cy={20} r={16} fill="none" stroke="#e5e7eb" strokeWidth={4} />
            <circle
              cx={20}
              cy={20}
              r={16}
              fill="none"
              stroke="#6B3F8D"
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={`${totalCount > 0 ? (completedCount / totalCount) * 100.53 : 0} 100.53`}
              transform="rotate(-90 20 20)"
            />
          </svg>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {actions.slice(0, 5).map((action) => (
            <li key={action.id} className="flex items-start gap-3">
              <div
                className={[
                  'flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center',
                  action.completed
                    ? 'bg-brand-purple border-brand-purple'
                    : 'border-gray-300',
                ].join(' ')}
              >
                {action.completed && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="white"
                    className="w-3 h-3"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={[
                    'text-sm font-medium',
                    action.completed ? 'text-gray-400 line-through' : 'text-brand-dark',
                  ].join(' ')}
                >
                  {action.title}
                </p>
                {action.description && !action.completed && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{action.description}</p>
                )}
              </div>
              {action.category && !action.completed && (
                <div className="flex-shrink-0 text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={getCategoryIcon(action.category)} />
                  </svg>
                </div>
              )}
            </li>
          ))}
        </ul>

        {actions.length > 5 && (
          <p className="text-xs text-gray-400 mt-3">
            +{actions.length - 5} more actions
          </p>
        )}

        <div className="mt-4 pt-3 border-t border-gray-100">
          <Link
            href="/plans"
            className="text-sm font-medium text-brand-purple hover:text-brand-purple-dark transition-colors"
          >
            View full plan &rarr;
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export { PlanActions };
