import React from 'react';

type ProgressColor = 'purple' | 'pink' | 'green' | 'blue';

export interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: ProgressColor;
  className?: string;
}

const colorClasses: Record<ProgressColor, string> = {
  purple: 'bg-brand-purple',
  pink: 'bg-brand-pink',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
};

function Progress({
  value,
  max = 100,
  label,
  showValue = false,
  color = 'purple',
  className = '',
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-sm font-medium text-brand-dark">{label}</span>
          )}
          {showValue && (
            <span className="text-sm text-gray-500">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div
        className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progress: ${Math.round(percentage)}%`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export { Progress };
