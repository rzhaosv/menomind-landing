'use client';

import React, { useId } from 'react';

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  className?: string;
}

const SEVERITY_LABELS = [
  'None',
  'Mild',
  'Moderate',
  'Significant',
  'Severe',
  'Extreme',
] as const;

/**
 * Color stops: 0 = green, 5 = red.
 * Gradient moves from green through yellow/orange to red.
 */
function getTrackGradient(): string {
  return 'linear-gradient(to right, #22c55e, #eab308, #f97316, #ef4444)';
}

function getThumbColor(value: number): string {
  const colors = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#dc2626'];
  return colors[Math.min(value, 5)];
}

function Slider({
  value,
  onChange,
  min = 0,
  max = 5,
  step = 1,
  label,
  disabled = false,
  className = '',
}: SliderProps) {
  const id = useId();
  const percentage = ((value - min) / (max - min)) * 100;
  const severityLabel = SEVERITY_LABELS[value] ?? '';

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-brand-dark mb-1"
        >
          {label}
        </label>
      )}

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">
          {severityLabel}
        </span>
        <span
          className="text-sm font-semibold tabular-nums"
          style={{ color: getThumbColor(value) }}
        >
          {value}/{max}
        </span>
      </div>

      <div className="relative">
        {/* Track background */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 rounded-full"
          style={{ background: getTrackGradient() }}
          aria-hidden="true"
        />

        {/* Filled portion overlay (dims the unfilled part) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-2 rounded-r-full bg-gray-200/70"
          style={{ left: `${percentage}%`, right: 0 }}
          aria-hidden="true"
        />

        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative w-full h-2 appearance-none bg-transparent cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-track]:bg-transparent"
          style={{
            // Dynamic thumb color via CSS custom property
            ['--thumb-color' as string]: getThumbColor(value),
          }}
          aria-label={label || 'Severity level'}
          aria-valuetext={`${severityLabel}: ${value} out of ${max}`}
        />

        {/* Inject dynamic thumb color styles */}
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            background-color: var(--thumb-color, #6B3F8D);
          }
          input[type="range"]::-moz-range-thumb {
            background-color: var(--thumb-color, #6B3F8D);
          }
        `}</style>
      </div>

      {/* Scale labels */}
      <div className="flex justify-between mt-1.5 px-0.5" aria-hidden="true">
        {SEVERITY_LABELS.map((lbl, i) => (
          <span
            key={lbl}
            className={`text-[10px] ${
              i === value ? 'text-brand-dark font-semibold' : 'text-gray-400'
            }`}
          >
            {lbl}
          </span>
        ))}
      </div>
    </div>
  );
}

export { Slider, SEVERITY_LABELS };
