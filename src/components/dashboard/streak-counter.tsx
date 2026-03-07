import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export interface StreakCounterProps {
  streak: number;
}

function StreakCounter({ streak }: StreakCounterProps) {
  const hasStreak = streak > 0;

  return (
    <Card className="relative overflow-hidden">
      {/* Background decoration */}
      {hasStreak && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-100 to-transparent rounded-bl-full opacity-60" />
      )}
      <CardContent className="flex items-center gap-4">
        {/* Flame icon */}
        <div
          className={[
            'flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center',
            hasStreak
              ? 'bg-gradient-to-br from-orange-400 to-red-500'
              : 'bg-gray-200',
          ].join(' ')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={hasStreak ? 'white' : '#9ca3af'}
            className="w-7 h-7"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div>
          <p className="text-3xl font-bold text-brand-dark leading-none">
            {streak}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {streak === 1 ? 'day streak' : 'day streak'}
          </p>
        </div>

        {hasStreak && streak >= 7 && (
          <div className="ml-auto">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
              On fire!
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { StreakCounter };
