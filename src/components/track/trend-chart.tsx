'use client';

import React, { useMemo } from 'react';

interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  title?: string;
  type?: 'bar' | 'line';
  height?: number;
  maxValue?: number;
  className?: string;
}

const SEVERITY_COLORS = [
  '#22c55e',
  '#84cc16',
  '#eab308',
  '#f97316',
  '#ef4444',
  '#dc2626',
] as const;

function getColor(value: number): string {
  return SEVERITY_COLORS[Math.min(Math.round(value), 5)] ?? SEVERITY_COLORS[0];
}

function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { weekday: 'short' });
  } catch {
    return dateStr;
  }
}

function TrendChart({
  data,
  title,
  type = 'bar',
  height = 160,
  maxValue = 5,
  className = '',
}: TrendChartProps) {
  const svgWidth = 100;
  const svgHeight = 100;
  const padding = { top: 10, right: 5, bottom: 20, left: 5 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  const points = useMemo(() => {
    if (data.length === 0) return [];
    const step = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth / 2;
    return data.map((d, i) => ({
      x: padding.left + (data.length > 1 ? i * step : chartWidth / 2),
      y: padding.top + chartHeight - (d.value / maxValue) * chartHeight,
      value: d.value,
      date: d.date,
      label: d.label,
    }));
  }, [data, chartWidth, chartHeight, maxValue, padding.left, padding.top]);

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`} style={{ height }}>
        <p className="text-sm text-gray-400">No data available yet</p>
      </div>
    );
  }

  const barWidth = Math.min(8, chartWidth / data.length - 2);

  // Build line path
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Build area fill path
  const areaPath = linePath
    + ` L ${points[points.length - 1].x} ${padding.top + chartHeight}`
    + ` L ${points[0].x} ${padding.top + chartHeight} Z`;

  return (
    <div className={className}>
      {title && (
        <h4 className="text-sm font-medium text-brand-dark mb-2">{title}</h4>
      )}
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width="100%"
        height={height}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={title ? `${title} trend chart` : 'Trend chart'}
      >
        {/* Grid lines */}
        {[0, 1, 2, 3, 4, 5].map((v) => {
          const y = padding.top + chartHeight - (v / maxValue) * chartHeight;
          return (
            <line
              key={v}
              x1={padding.left}
              y1={y}
              x2={padding.left + chartWidth}
              y2={y}
              stroke="#f3f4f6"
              strokeWidth="0.3"
            />
          );
        })}

        {type === 'bar' ? (
          /* Bar chart */
          points.map((p, i) => (
            <g key={i}>
              <rect
                x={p.x - barWidth / 2}
                y={p.y}
                width={barWidth}
                height={padding.top + chartHeight - p.y}
                rx="1"
                fill={getColor(p.value)}
                opacity="0.85"
              />
              {/* Date label */}
              <text
                x={p.x}
                y={svgHeight - 2}
                textAnchor="middle"
                className="fill-gray-400"
                fontSize="3.5"
              >
                {formatDateLabel(p.date)}
              </text>
            </g>
          ))
        ) : (
          /* Line chart */
          <>
            {/* Area fill */}
            <path
              d={areaPath}
              fill="url(#trendGradient)"
              opacity="0.15"
            />
            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke="#6B3F8D"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Dots */}
            {points.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="1.8"
                  fill={getColor(p.value)}
                  stroke="white"
                  strokeWidth="0.5"
                />
                <text
                  x={p.x}
                  y={svgHeight - 2}
                  textAnchor="middle"
                  className="fill-gray-400"
                  fontSize="3.5"
                >
                  {formatDateLabel(p.date)}
                </text>
              </g>
            ))}
            {/* Gradient definition */}
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6B3F8D" />
                <stop offset="100%" stopColor="#6B3F8D" stopOpacity="0" />
              </linearGradient>
            </defs>
          </>
        )}
      </svg>
    </div>
  );
}

export { TrendChart };
export type { TrendDataPoint };
