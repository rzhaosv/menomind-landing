'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface SymptomLogEntry {
  id: string;
  logged_at: string;
  overall_severity: number;
  symptoms: { name: string; severity: number }[];
  notes?: string | null;
}

export interface SymptomSummaryProps {
  todayLog: SymptomLogEntry | null;
}

function SeverityBadge({ severity }: { severity: number }) {
  const colors =
    severity <= 3
      ? 'bg-green-100 text-green-700'
      : severity <= 6
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-red-100 text-red-700';

  const label =
    severity <= 3 ? 'Mild' : severity <= 6 ? 'Moderate' : 'Severe';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors}`}>
      {label} ({severity}/10)
    </span>
  );
}

function SymptomSummary({ todayLog }: SymptomSummaryProps) {
  if (!todayLog) {
    return (
      <Card className="border-2 border-brand-purple/15 bg-gradient-to-br from-brand-purple/[0.03] to-brand-pink/[0.03]">
        <CardContent className="text-center py-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-brand-purple/10 flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-lg font-semibold text-brand-dark mb-1">
            Start your daily check-in
          </h3>
          <p className="text-gray-500 text-sm mb-2">
            It takes 30 seconds. After 7 days, you&apos;ll start seeing patterns you can&apos;t spot on your own.
          </p>
          <p className="text-xs text-brand-purple font-medium mb-5">
            Women who track daily are 3x more likely to identify symptom triggers
          </p>
          <Link href="/track">
            <Button size="md">Log Today&apos;s Symptoms</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Today&apos;s Symptoms</CardTitle>
        <SeverityBadge severity={todayLog.overall_severity} />
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          {todayLog.symptoms.slice(0, 5).map((symptom) => (
            <div key={symptom.name} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{symptom.name}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={[
                      'h-full rounded-full',
                      symptom.severity <= 3
                        ? 'bg-green-400'
                        : symptom.severity <= 6
                          ? 'bg-yellow-400'
                          : 'bg-red-400',
                    ].join(' ')}
                    style={{ width: `${(symptom.severity / 10) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-6 text-right">
                  {symptom.severity}
                </span>
              </div>
            </div>
          ))}
          {todayLog.symptoms.length > 5 && (
            <p className="text-xs text-gray-400">
              +{todayLog.symptoms.length - 5} more symptoms logged
            </p>
          )}
        </div>
        {todayLog.notes && (
          <p className="text-sm text-gray-500 italic border-t border-gray-100 pt-3">
            &ldquo;{todayLog.notes}&rdquo;
          </p>
        )}
        <div className="mt-4">
          <Link
            href="/track"
            className="text-sm font-medium text-brand-purple hover:text-brand-purple-dark transition-colors"
          >
            Update log &rarr;
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export { SymptomSummary };
