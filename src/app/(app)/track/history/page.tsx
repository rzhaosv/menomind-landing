'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendChart, type TrendDataPoint } from '@/components/track/trend-chart';
import { UpgradePrompt } from '@/components/subscription/upgrade-prompt';
import { Button } from '@/components/ui/button';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

interface SymptomDef {
  key: string;
  name: string;
  emoji: string;
}

const SYMPTOMS: SymptomDef[] = [
  { key: 'hot_flashes', name: 'Hot Flashes', emoji: '🔥' },
  { key: 'night_sweats', name: 'Night Sweats', emoji: '🌙' },
  { key: 'sleep_quality', name: 'Sleep Quality', emoji: '😴' },
  { key: 'mood', name: 'Mood', emoji: '😊' },
  { key: 'energy_level', name: 'Energy Level', emoji: '⚡' },
  { key: 'brain_fog', name: 'Brain Fog', emoji: '🧠' },
  { key: 'joint_pain', name: 'Joint Pain', emoji: '🦴' },
  { key: 'weight_changes', name: 'Weight Changes', emoji: '⚖️' },
  { key: 'menstrual_cycle', name: 'Menstrual Cycle', emoji: '🩸' },
  { key: 'libido', name: 'Libido', emoji: '❤️' },
];

const SEVERITY_LABELS = ['None', 'Mild', 'Moderate', 'Significant', 'Severe', 'Extreme'] as const;

const SEVERITY_COLORS = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#dc2626'] as const;

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SymptomEntry {
  date: string;
  symptoms: Record<string, number>;
  notes?: string;
}

type DateRange = '7d' | '30d' | '90d';

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function HistoryPage() {
  const [entries, setEntries] = useState<SymptomEntry[]>([]);
  const [trendData, setTrendData] = useState<Record<string, TrendDataPoint[]>>({});
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [selectedSymptom, setSelectedSymptom] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [userTier, setUserTier] = useState<string>('free');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const rangeDays: Record<DateRange, number> = { '7d': 7, '30d': 30, '90d': 90 };

  const fetchHistory = useCallback(async (range: DateRange) => {
    try {
      setLoading(true);
      setError(null);

      const days = rangeDays[range];
      const endDate = getDateString(new Date());
      const startDate = getDateString(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));

      const res = await fetch(`/api/symptoms/log?startDate=${startDate}&endDate=${endDate}&trend=true&entries=true`);
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (res.status === 403 && errData?.upgrade) {
          setUserTier('free');
          setShowUpgrade(true);
          return;
        }
        throw new Error(errData?.error || 'Failed to load history');
      }

      const data = await res.json();
      setEntries(data.entries ?? []);
      setTrendData(data.trends ?? {});
      setUserTier(data.tier ?? 'free');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(dateRange);
  }, [dateRange, fetchHistory]);

  const handleRangeChange = (range: DateRange) => {
    if (range !== '7d' && userTier === 'free') {
      setShowUpgrade(true);
      return;
    }
    setDateRange(range);
  };

  // Filter symptoms for display
  const displaySymptoms = useMemo(() => {
    if (selectedSymptom === 'all') return SYMPTOMS;
    return SYMPTOMS.filter((s) => s.key === selectedSymptom);
  }, [selectedSymptom]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Symptom History</h1>
          <p className="text-sm text-gray-500 mt-1">Track your symptom patterns over time.</p>
        </div>
        <a href="/track">
          <Button variant="secondary" size="sm">
            Log Today
          </Button>
        </a>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Date range */}
        <div className="flex bg-white rounded-lg border border-gray-200 p-1">
          {(['7d', '30d', '90d'] as DateRange[]).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => handleRangeChange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                dateRange === range
                  ? 'bg-brand-purple text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              {range !== '7d' && userTier === 'free' && (
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline ml-1" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Symptom filter */}
        <select
          value={selectedSymptom}
          onChange={(e) => setSelectedSymptom(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple"
          aria-label="Filter by symptom"
        >
          <option value="all">All Symptoms</option>
          {SYMPTOMS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.emoji} {s.name}
            </option>
          ))}
        </select>

        {/* View mode toggle */}
        <div className="flex bg-white rounded-lg border border-gray-200 p-1">
          <button
            type="button"
            onClick={() => setViewMode('chart')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'chart'
                ? 'bg-brand-purple text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Chart
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-brand-purple text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-32 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : viewMode === 'chart' ? (
        /* Chart view */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displaySymptoms.map((symptom) => {
            const data = trendData[symptom.key] ?? [];
            return (
              <div
                key={symptom.key}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
              >
                <TrendChart
                  data={data}
                  title={`${symptom.emoji} ${symptom.name}`}
                  type="line"
                  height={150}
                />
              </div>
            );
          })}
        </div>
      ) : (
        /* Table view */
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-brand-dark bg-gray-50 sticky left-0">
                    Date
                  </th>
                  {displaySymptoms.map((s) => (
                    <th key={s.key} className="text-center px-3 py-3 font-medium text-brand-dark bg-gray-50 whitespace-nowrap">
                      <span className="mr-1">{s.emoji}</span>
                      <span className="hidden sm:inline">{s.name}</span>
                    </th>
                  ))}
                  <th className="text-left px-4 py-3 font-medium text-brand-dark bg-gray-50">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={displaySymptoms.length + 2}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      No entries found for this period.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.date} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-brand-dark font-medium whitespace-nowrap sticky left-0 bg-white">
                        {new Date(entry.date).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      {displaySymptoms.map((s) => {
                        const val = entry.symptoms[s.key] ?? 0;
                        const color = SEVERITY_COLORS[val] ?? SEVERITY_COLORS[0];
                        return (
                          <td key={s.key} className="text-center px-3 py-3">
                            <span
                              className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                color,
                                backgroundColor: `${color}15`,
                              }}
                              title={SEVERITY_LABELS[val]}
                            >
                              {val}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">
                        {entry.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upgrade prompt */}
      {showUpgrade && (
        <UpgradePrompt
          feature="extended symptom history (30+ days), advanced charts, and downloadable reports"
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
}
