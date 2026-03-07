'use client';

import React, { useId } from 'react';

const SEVERITY_LABELS = [
  'None',
  'Mild',
  'Moderate',
  'Significant',
  'Severe',
  'Extreme',
] as const;

const SEVERITY_COLORS = [
  '#22c55e',
  '#84cc16',
  '#eab308',
  '#f97316',
  '#ef4444',
  '#dc2626',
] as const;

interface SymptomSliderProps {
  name: string;
  emoji: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

function SymptomSlider({ name, emoji, value, onChange, disabled = false }: SymptomSliderProps) {
  const id = useId();
  const percentage = (value / 5) * 100;
  const severityLabel = SEVERITY_LABELS[value] ?? 'None';
  const color = SEVERITY_COLORS[value] ?? SEVERITY_COLORS[0];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">{emoji}</span>
          <label htmlFor={id} className="text-sm font-medium text-brand-dark">
            {name}
          </label>
        </div>
        <span
          className="text-sm font-semibold px-2 py-0.5 rounded-full"
          style={{
            color,
            backgroundColor: `${color}15`,
          }}
        >
          {severityLabel}
        </span>
      </div>

      {/* Slider */}
      <div className="relative">
        {/* Track background */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 rounded-full"
          style={{
            background: 'linear-gradient(to right, #22c55e, #eab308, #f97316, #ef4444)',
          }}
          aria-hidden="true"
        />
        {/* Dim unfilled portion */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-2 rounded-r-full bg-gray-200/70"
          style={{ left: `${percentage}%`, right: 0 }}
          aria-hidden="true"
        />

        <input
          id={id}
          type="range"
          min={0}
          max={5}
          step={1}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative w-full h-2 appearance-none bg-transparent cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-track]:bg-transparent"
          style={{
            ['--thumb-color' as string]: color,
          }}
          aria-label={`${name} severity level`}
          aria-valuetext={`${severityLabel}: ${value} out of 5`}
        />

        <style>{`
          #${CSS.escape(id)}::-webkit-slider-thumb {
            background-color: ${color};
          }
          #${CSS.escape(id)}::-moz-range-thumb {
            background-color: ${color};
          }
        `}</style>
      </div>

      {/* Scale labels */}
      <div className="flex justify-between mt-1.5 px-0.5" aria-hidden="true">
        {SEVERITY_LABELS.map((label, i) => (
          <span
            key={label}
            className={`text-[10px] ${
              i === value ? 'text-brand-dark font-semibold' : 'text-gray-400'
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export { SymptomSlider, SEVERITY_LABELS };
