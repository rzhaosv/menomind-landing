'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PlanCard, type PlanCardData } from '@/components/plans/plan-card';
import { UpgradePrompt } from '@/components/subscription/upgrade-prompt';

/* ------------------------------------------------------------------ */
/*  Default plan definitions                                           */
/* ------------------------------------------------------------------ */

const PLAN_DEFINITIONS: Omit<PlanCardData, 'status' | 'progress'>[] = [
  {
    type: 'nutrition',
    title: 'Nutrition',
    description: 'Personalized meal plans and dietary recommendations to support hormonal balance and reduce symptoms.',
    icon: '🥗',
  },
  {
    type: 'exercise',
    title: 'Exercise',
    description: 'Tailored workout routines designed for your energy levels, joint health, and overall well-being.',
    icon: '🏃‍♀️',
  },
  {
    type: 'sleep',
    title: 'Sleep',
    description: 'Evidence-based sleep hygiene practices and routines to combat insomnia and night sweats.',
    icon: '😴',
  },
  {
    type: 'stress',
    title: 'Stress Management',
    description: 'Mindfulness, breathing exercises, and lifestyle adjustments to manage anxiety and mood changes.',
    icon: '🧘',
  },
  {
    type: 'supplement',
    title: 'Supplements',
    description: 'Curated supplement recommendations backed by research for menopause symptom relief.',
    icon: '💊',
  },
];

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [userTier, setUserTier] = useState<string>('free');

  // Fetch existing plans
  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/plans');
      if (res.ok) {
        const data = await res.json();
        const activePlans: Record<string, { progress: number }> = {};
        (data.plans ?? []).forEach((p: { type: string; progress: number }) => {
          activePlans[p.type] = p;
        });
        setUserTier(data.tier ?? 'free');

        // Merge definitions with active plans
        const merged = PLAN_DEFINITIONS.map((def, index) => {
          const active = activePlans[def.type];
          const isFreeUser = (data.tier ?? 'free') === 'free';
          const isLocked = isFreeUser && index > 0 && !active;

          return {
            ...def,
            status: (active ? 'active' : isLocked ? 'locked' : 'not_started') as PlanCardData['status'],
            progress: active?.progress,
          };
        });

        setPlans(merged);
      } else {
        // If API not available, show default state
        setPlans(
          PLAN_DEFINITIONS.map((def, index) => ({
            ...def,
            status: (index === 0 ? 'not_started' : 'locked') as PlanCardData['status'],
          }))
        );
      }
    } catch {
      // Fallback to defaults
      setPlans(
        PLAN_DEFINITIONS.map((def, index) => ({
          ...def,
          status: (index === 0 ? 'not_started' : 'locked') as PlanCardData['status'],
        }))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleGenerate = async (type: string) => {
    // Check if user is free and trying to generate a locked plan
    const planIndex = PLAN_DEFINITIONS.findIndex((p) => p.type === type);
    if (userTier === 'free' && planIndex > 0) {
      setShowUpgrade(true);
      return;
    }

    try {
      setGenerating(type);
      setError(null);

      const res = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType: type }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (res.status === 403) {
          setShowUpgrade(true);
          return;
        }
        throw new Error(errData?.error || 'Failed to generate plan');
      }

      const data = await res.json();
      // Navigate to the plan detail page
      router.push(`/plans/${type}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      setGenerating(null);
    }
  };

  const handleView = (type: string) => {
    router.push(`/plans/${type}`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-dark">Wellness Plans</h1>
        <p className="text-sm text-gray-500 mt-1">
          Personalized plans tailored to your symptoms and goals. Powered by AI and backed by research.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-2" aria-label="Dismiss error">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Plans grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm animate-pulse">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                </div>
              </div>
              <div className="h-8 bg-gray-100 rounded mt-4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <PlanCard
              key={plan.type}
              plan={plan}
              onGenerate={handleGenerate}
              onView={handleView}
              generating={generating === plan.type}
            />
          ))}
        </div>
      )}

      {/* Free tier info */}
      {userTier === 'free' && !loading && (
        <div className="mt-8 p-5 bg-gradient-to-r from-brand-purple/5 to-brand-pink/5 border border-brand-purple/10 rounded-xl text-center">
          <p className="text-sm text-brand-dark font-medium mb-1">
            Free plan includes 1 wellness plan
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Upgrade to Premium to unlock all 5 personalized plans with weekly action items.
          </p>
          <a
            href="/pricing"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-purple hover:text-brand-purple-dark transition-colors"
          >
            View Premium Plans
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </a>
        </div>
      )}

      {/* Upgrade modal */}
      {showUpgrade && (
        <UpgradePrompt
          feature="all 5 personalized wellness plans with daily action items and progress tracking"
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
}
