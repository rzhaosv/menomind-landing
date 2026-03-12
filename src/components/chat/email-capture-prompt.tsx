'use client';

import React, { useState } from 'react';

interface EmailCapturePromptProps {
  quizSymptoms?: string[];
  quizLevel?: string;
  onDismiss: () => void;
  onSubmit?: (email: string) => void;
}

function EmailCapturePrompt({ quizSymptoms, quizLevel, onDismiss, onSubmit }: EmailCapturePromptProps) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/waitlist/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          quizSymptoms,
          quizLevel,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to save. Please try again.');
      }

      setSubmitted(true);
      // Google Ads Lead conversion
      if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', 'conversion', {
          'send_to': 'AW-17830146300/qbF8CJjiioccEPzhibZC',
          'value': 1.0,
          'currency': 'USD'
        });
      }
      // Meta Pixel Lead event
      if (typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
        (window as any).fbq('track', 'Lead');
      }
      onSubmit?.(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="my-4 mx-auto max-w-md">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
          <p className="text-sm text-green-700 font-medium">
            Got it! I&apos;ll reach out in a few days to see how you&apos;re doing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 mx-auto max-w-md">
      <div className="bg-brand-purple/5 border border-brand-purple/15 rounded-2xl p-5">
        <p className="text-sm text-brand-dark font-medium mb-1">
          Your symptoms may change week to week.
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Want me to check in with you in a few days?
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-50"
          >
            {submitting ? '...' : 'Yes, check in'}
          </button>
        </form>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        <button
          type="button"
          onClick={onDismiss}
          className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Not now — keep chatting
        </button>
      </div>
    </div>
  );
}

export { EmailCapturePrompt };
