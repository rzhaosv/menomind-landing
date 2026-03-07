import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export interface DayData {
  date: string;
  avgSeverity: number | null;
}

export interface TrendChartProps {
  days: DayData[];
}

function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function getBarColor(severity: number): string {
  if (severity <= 3) return '#4ade80'; // green-400
  if (severity <= 6) return '#facc15'; // yellow-400
  return '#f87171'; // red-400
}

function TrendChart({ days }: TrendChartProps) {
  const maxSeverity = 10;
  const chartHeight = 120;
  const barWidth = 28;
  const barGap = 8;
  const totalWidth = days.length * (barWidth + barGap) - barGap;

  const hasAnyData = days.some((d) => d.avgSeverity !== null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasAnyData ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-sm text-gray-400">
              Not enough data yet. Start logging symptoms to see trends.
            </p>
          </div>
        ) : (
          <div className="flex justify-center overflow-x-auto">
            <svg
              width={totalWidth + 16}
              height={chartHeight + 32}
              viewBox={`0 0 ${totalWidth + 16} ${chartHeight + 32}`}
              role="img"
              aria-label="Weekly symptom severity trend chart"
              className="block"
            >
              {/* Horizontal guide lines */}
              {[0, 2.5, 5, 7.5, 10].map((val) => {
                const y = chartHeight - (val / maxSeverity) * chartHeight + 4;
                return (
                  <line
                    key={val}
                    x1={8}
                    y1={y}
                    x2={totalWidth + 8}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth={1}
                    strokeDasharray={val === 0 ? undefined : '4 4'}
                  />
                );
              })}

              {days.map((day, i) => {
                const x = i * (barWidth + barGap) + 8;
                const severity = day.avgSeverity;
                const barHeight =
                  severity !== null
                    ? Math.max(4, (severity / maxSeverity) * chartHeight)
                    : 0;
                const y = chartHeight - barHeight + 4;
                const label = getDayLabel(day.date);

                return (
                  <g key={day.date}>
                    {/* Bar */}
                    {severity !== null ? (
                      <>
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          rx={4}
                          fill={getBarColor(severity)}
                          opacity={0.85}
                        />
                        {/* Severity value */}
                        <text
                          x={x + barWidth / 2}
                          y={y - 4}
                          textAnchor="middle"
                          className="text-[10px] fill-gray-500"
                        >
                          {severity.toFixed(1)}
                        </text>
                      </>
                    ) : (
                      <rect
                        x={x}
                        y={chartHeight}
                        width={barWidth}
                        height={4}
                        rx={2}
                        fill="#e5e7eb"
                      />
                    )}

                    {/* Day label */}
                    <text
                      x={x + barWidth / 2}
                      y={chartHeight + 22}
                      textAnchor="middle"
                      className="text-[11px] fill-gray-500 font-medium"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* Legend */}
        {hasAnyData && (
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-green-400 inline-block" />
              Mild
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-yellow-400 inline-block" />
              Moderate
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" />
              Severe
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { TrendChart };
