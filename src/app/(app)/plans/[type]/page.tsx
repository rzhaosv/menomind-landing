'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ActionItem, type ActionItemData } from '@/components/plans/action-item';
import { Button } from '@/components/ui/button';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DayPlan {
  day: string;
  label: string;
  items: ActionItemData[];
}

interface WeekPlan {
  weekNumber: number;
  title: string;
  days: DayPlan[];
}

interface PlanDetail {
  type: string;
  title: string;
  description: string;
  icon: string;
  weeks: WeekPlan[];
  progress: number;
}

const PLAN_META: Record<string, { title: string; icon: string }> = {
  nutrition: { title: 'Nutrition Plan', icon: '🥗' },
  exercise: { title: 'Exercise Plan', icon: '🏃‍♀️' },
  sleep: { title: 'Sleep Plan', icon: '😴' },
  stress: { title: 'Stress Management Plan', icon: '🧘' },
  supplements: { title: 'Supplements Plan', icon: '💊' },
};

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planType = params.type as string;

  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number>(0);

  const meta = PLAN_META[planType] ?? { title: 'Wellness Plan', icon: '✨' };

  const fetchPlan = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/plans/${planType}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push('/plans');
          return;
        }
        throw new Error('Failed to load plan');
      }

      const data = await res.json();
      setPlan(data.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plan');
    } finally {
      setLoading(false);
    }
  }, [planType, router]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const handleToggleItem = async (itemId: string) => {
    if (!plan) return;

    // Optimistic update
    setPlan((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      updated.weeks = updated.weeks.map((week) => ({
        ...week,
        days: week.days.map((day) => ({
          ...day,
          items: day.items.map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          ),
        })),
      }));

      // Recalculate progress
      let total = 0;
      let completed = 0;
      updated.weeks.forEach((w) =>
        w.days.forEach((d) =>
          d.items.forEach((item) => {
            total++;
            if (item.completed) completed++;
          })
        )
      );
      updated.progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return updated;
    });

    // Persist to API
    try {
      await fetch(`/api/plans/${planType}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
    } catch {
      // Revert on error
      fetchPlan();
    }
  };

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      setError(null);

      const res = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: planType, regenerate: true }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to regenerate plan');
      }

      await fetchPlan();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate plan');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-2/3 mb-8" />
          <div className="h-3 bg-gray-200 rounded-full w-full mb-8" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
              <div className="h-5 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => router.push('/plans')} variant="secondary">
          Back to Plans
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push('/plans')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 mt-0.5"
            aria-label="Back to plans"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden="true">{plan?.icon ?? meta.icon}</span>
              <h1 className="text-2xl font-bold text-brand-dark">
                {plan?.title ?? meta.title}
              </h1>
            </div>
            {plan?.description && (
              <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
            )}
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleRegenerate}
          loading={regenerating}
        >
          Regenerate Plan
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Overall progress */}
      {plan && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-brand-dark">Overall Progress</span>
            <span className="font-semibold text-brand-purple">{plan.progress}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-purple to-brand-pink rounded-full transition-all duration-500"
              style={{ width: `${plan.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Weekly breakdown */}
      {plan?.weeks.map((week, weekIdx) => {
        const isExpanded = expandedWeek === weekIdx;
        const weekCompleted = week.days.reduce(
          (acc, day) => acc + day.items.filter((i) => i.completed).length,
          0
        );
        const weekTotal = week.days.reduce(
          (acc, day) => acc + day.items.length,
          0
        );

        return (
          <div
            key={weekIdx}
            className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4 overflow-hidden"
          >
            {/* Week header */}
            <button
              type="button"
              onClick={() => setExpandedWeek(isExpanded ? -1 : weekIdx)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
              aria-expanded={isExpanded}
            >
              <div>
                <h3 className="font-semibold text-brand-dark">
                  Week {week.weekNumber}: {week.title}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {weekCompleted}/{weekTotal} completed
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Mini progress */}
                <div className="hidden sm:block w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-purple rounded-full"
                    style={{
                      width: `${weekTotal > 0 ? (weekCompleted / weekTotal) * 100 : 0}%`,
                    }}
                  />
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-gray-400 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>

            {/* Week content */}
            {isExpanded && (
              <div className="border-t border-gray-100 px-5 pb-5">
                {week.days.map((day, dayIdx) => (
                  <div key={dayIdx} className="mt-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      {day.label}
                    </h4>
                    <div className="space-y-1">
                      {day.items.map((item) => (
                        <ActionItem
                          key={item.id}
                          item={item}
                          onToggle={handleToggleItem}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Empty state */}
      {plan && plan.weeks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 mb-4">
            This plan hasn&apos;t been generated yet.
          </p>
          <Button onClick={handleRegenerate} loading={regenerating}>
            Generate Plan
          </Button>
        </div>
      )}
    </div>
  );
}
