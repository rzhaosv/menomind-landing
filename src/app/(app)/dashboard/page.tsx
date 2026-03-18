import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Greeting } from '@/components/dashboard/greeting';
import { SymptomSummary, type SymptomLogEntry } from '@/components/dashboard/symptom-summary';
import { StreakCounter } from '@/components/dashboard/streak-counter';
import { TrendChart, type DayData } from '@/components/dashboard/trend-chart';
import { PlanActions, type PlanAction } from '@/components/dashboard/plan-actions';
import { QuickChat } from '@/components/dashboard/quick-chat';
import { UpgradeBanner } from '@/components/dashboard/upgrade-banner';
import { DoctorReportCard } from '@/components/dashboard/doctor-report-card';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getLast7Days(): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function computeStreak(
  logs: { logged_at: string }[],
): number {
  if (logs.length === 0) return 0;

  // Get unique dates sorted descending
  const dateSet = new Set(
    logs.map((l) => {
      const d = new Date(l.logged_at);
      return d.toISOString().split('T')[0];
    }),
  );
  const uniqueDates = Array.from(dateSet).sort((a, b) => b.localeCompare(a));

  const today = getToday();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Streak must start from today or yesterday
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterdayStr) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1]);
    const curr = new Date(uniqueDates[i]);
    const diffMs = prev.getTime() - curr.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/* ------------------------------------------------------------------ */
/*  Page (Server Component)                                            */
/* ------------------------------------------------------------------ */

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch all data in parallel
  const today = getToday();
  const last7 = getLast7Days();
  const sevenDaysAgo = last7[0];

  const [
    { data: userData },
    { data: todayLogRaw },
    { data: recentLogsRaw },
    { data: activePlanRaw },
  ] = await Promise.all([
    // User info
    supabase
      .from('users')
      .select('full_name, subscription_tier')
      .eq('id', user.id)
      .single(),

    // Today's symptom log
    supabase
      .from('symptom_logs')
      .select('id, logged_at, overall_severity, symptoms, notes')
      .eq('user_id', user.id)
      .gte('logged_at', `${today}T00:00:00`)
      .lte('logged_at', `${today}T23:59:59`)
      .order('logged_at', { ascending: false })
      .limit(1),

    // Last 30 days of logs for streak + 7-day trend
    supabase
      .from('symptom_logs')
      .select('id, logged_at, overall_severity, symptoms')
      .eq('user_id', user.id)
      .gte('logged_at', `${sevenDaysAgo}T00:00:00`)
      .order('logged_at', { ascending: false })
      .limit(100),

    // Active wellness plan with actions
    supabase
      .from('wellness_plans')
      .select('id, name, actions:plan_actions(id, title, description, completed, category)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  // Also fetch streak data (last 60 days for proper streak calc)
  const { data: streakLogsRaw } = await supabase
    .from('symptom_logs')
    .select('logged_at')
    .eq('user_id', user.id)
    .gte('logged_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
    .order('logged_at', { ascending: false })
    .limit(200);

  // Process data
  const name = userData?.full_name ?? user.user_metadata?.full_name ?? '';
  const tier = userData?.subscription_tier ?? 'free';

  // Today's log
  const todayLog: SymptomLogEntry | null =
    todayLogRaw && todayLogRaw.length > 0
      ? {
          id: todayLogRaw[0].id,
          logged_at: todayLogRaw[0].logged_at,
          overall_severity: todayLogRaw[0].overall_severity ?? 0,
          symptoms: Array.isArray(todayLogRaw[0].symptoms)
            ? (todayLogRaw[0].symptoms as { name: string; severity: number }[])
            : [],
          notes: todayLogRaw[0].notes ?? null,
        }
      : null;

  // Streak
  const streak = computeStreak(streakLogsRaw ?? []);

  // Weekly trend data
  const weeklyData: DayData[] = last7.map((date) => {
    const logsForDay = (recentLogsRaw ?? []).filter((log) => {
      const logDate = new Date(log.logged_at).toISOString().split('T')[0];
      return logDate === date;
    });

    if (logsForDay.length === 0) {
      return { date, avgSeverity: null };
    }

    const avgSeverity =
      logsForDay.reduce((sum, log) => sum + (log.overall_severity ?? 0), 0) /
      logsForDay.length;

    return { date, avgSeverity: Math.round(avgSeverity * 10) / 10 };
  });

  // Active plan
  const activePlan = activePlanRaw && activePlanRaw.length > 0 ? activePlanRaw[0] : null;
  const planActions: PlanAction[] = activePlan?.actions
    ? (activePlan.actions as unknown as PlanAction[])
    : [];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Greeting */}
      <Greeting name={name} />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2 cols wide on lg) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's symptoms */}
          <SymptomSummary todayLog={todayLog} />

          {/* Weekly trend */}
          <TrendChart days={weeklyData} />

          {/* Active plan */}
          <PlanActions
            planName={activePlan?.name ?? null}
            actions={planActions}
          />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Streak */}
          <StreakCounter streak={streak} />

          {/* Quick chat */}
          <QuickChat />

          {/* Doctor report card (premium users) */}
          <DoctorReportCard
            tier={tier}
            daysLogged={
              new Set(
                (streakLogsRaw ?? []).map((l) =>
                  new Date(l.logged_at).toISOString().split('T')[0]
                )
              ).size
            }
          />

          {/* Upgrade banner (free users only) */}
          <UpgradeBanner tier={tier} />
        </div>
      </div>
    </div>
  );
}
