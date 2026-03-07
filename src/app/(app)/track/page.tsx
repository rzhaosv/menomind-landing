'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SymptomSlider } from '@/components/track/symptom-slider';
import { TrendChart, type TrendDataPoint } from '@/components/track/trend-chart';
import { Button } from '@/components/ui/button';

/* ------------------------------------------------------------------ */
/*  Symptom definitions                                                */
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

type SymptomValues = Record<string, number>;

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/* ------------------------------------------------------------------ */
/*  Toast component                                                    */
/* ------------------------------------------------------------------ */

function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-24 lg:bottom-8 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in">
      <div className="flex items-center gap-3 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function TrackPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [values, setValues] = useState<SymptomValues>(() => {
    const initial: SymptomValues = {};
    SYMPTOMS.forEach((s) => { initial[s.key] = 0; });
    return initial;
  });
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<Record<string, TrendDataPoint[]>>({});

  const isToday = getDateString(selectedDate) === getDateString(new Date());

  // Load existing entry for the selected date
  const loadEntry = useCallback(async (date: Date) => {
    try {
      setLoading(true);
      setError(null);
      const dateStr = getDateString(date);
      const res = await fetch(`/api/symptoms/log?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        if (data.entry) {
          const loaded: SymptomValues = {};
          SYMPTOMS.forEach((s) => {
            loaded[s.key] = data.entry.symptoms?.[s.key] ?? 0;
          });
          setValues(loaded);
          setNotes(data.entry.notes ?? '');
        } else {
          // No entry for this date, reset
          const reset: SymptomValues = {};
          SYMPTOMS.forEach((s) => { reset[s.key] = 0; });
          setValues(reset);
          setNotes('');
        }
      }
    } catch {
      // Silently handle - user can still enter data
    } finally {
      setLoading(false);
    }
  }, []);

  // Load 7-day trend data
  const loadTrends = useCallback(async () => {
    try {
      const endDate = getDateString(new Date());
      const startDate = getDateString(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
      const res = await fetch(`/api/symptoms/log?startDate=${startDate}&endDate=${endDate}&trend=true`);
      if (res.ok) {
        const data = await res.json();
        if (data.trends) {
          setTrendData(data.trends);
        }
      }
    } catch {
      // Trends are non-critical
    }
  }, []);

  useEffect(() => {
    loadEntry(selectedDate);
  }, [selectedDate, loadEntry]);

  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  const navigateDate = (direction: -1 | 1) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    // Don't allow future dates
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const res = await fetch('/api/symptoms/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: getDateString(selectedDate),
          symptoms: values,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to save symptoms');
      }

      setToast('Symptoms saved successfully!');
      loadTrends(); // Refresh trends after saving
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save symptoms');
    } finally {
      setSaving(false);
    }
  };

  const handleValueChange = (key: string, value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  // Pick a few key symptoms for the mini trend view
  const trendSymptoms = ['hot_flashes', 'sleep_quality', 'mood', 'energy_level'];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-dark">Symptom Tracker</h1>
        <p className="text-sm text-gray-500 mt-1">
          Log your daily symptoms to track patterns and share with your healthcare provider.
        </p>
      </div>

      {/* Date navigator */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <button
          type="button"
          onClick={() => navigateDate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          aria-label="Previous day"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="text-center">
          <p className="text-sm font-semibold text-brand-dark">
            {isToday ? 'Today' : formatDisplayDate(selectedDate)}
          </p>
          {isToday && (
            <p className="text-xs text-gray-400 mt-0.5">{formatDisplayDate(selectedDate)}</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigateDate(1)}
          disabled={isToday}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next day"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-2" aria-label="Dismiss error">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Symptom sliders */}
      {loading ? (
        <div className="space-y-4 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-2 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {SYMPTOMS.map((symptom) => (
            <SymptomSlider
              key={symptom.key}
              name={symptom.name}
              emoji={symptom.emoji}
              value={values[symptom.key] ?? 0}
              onChange={(val) => handleValueChange(symptom.key, val)}
            />
          ))}
        </div>
      )}

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <label htmlFor="symptom-notes" className="block text-sm font-medium text-brand-dark mb-2">
          Notes (optional)
        </label>
        <textarea
          id="symptom-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes about how you're feeling today..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-brand-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple resize-none"
        />
      </div>

      {/* Save button */}
      <div className="mb-8">
        <Button
          onClick={handleSave}
          loading={saving}
          disabled={loading}
          size="lg"
          className="w-full"
        >
          Save Symptoms
        </Button>
      </div>

      {/* 7-Day Trend mini-view */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-brand-dark">7-Day Trends</h2>
          <a
            href="/track/history"
            className="text-sm text-brand-purple hover:text-brand-purple-dark font-medium transition-colors"
          >
            View Full History
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {trendSymptoms.map((symptomKey) => {
            const symptom = SYMPTOMS.find((s) => s.key === symptomKey);
            const data = trendData[symptomKey] ?? [];
            return (
              <div
                key={symptomKey}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
              >
                <TrendChart
                  data={data}
                  title={`${symptom?.emoji ?? ''} ${symptom?.name ?? symptomKey}`}
                  type="bar"
                  height={120}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Toast */}
      {toast && <SuccessToast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
