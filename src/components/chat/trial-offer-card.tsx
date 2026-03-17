'use client';

import React, { useState } from 'react';

interface TrialOfferCardProps {
  onDismiss?: () => void;
  locked?: boolean;
}

function TrialOfferCard({ onDismiss, locked = false }: TrialOfferCardProps) {
  const [loading, setLoading] = useState(false);

  async function handleStartTrial() {
    setLoading(true);

    // Track the click
    if (typeof window !== 'undefined') {
      const w = window as any;
      if (typeof w.gtag === 'function') {
        w.gtag('event', 'chat_trial_click', { location: locked ? 'paywall' : 'inline_chat' });
        w.gtag('event', 'conversion', {
          'send_to': 'AW-17830146300/qbF8CJjiioccEPzhibZC',
          'value': 1.0,
          'currency': 'USD',
        });
      }
      if (typeof w.fbq === 'function') {
        w.fbq('track', 'InitiateCheckout');
      }
    }

    try {
      const res = await fetch('/api/stripe/checkout-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const { url } = await res.json();
        if (url) window.location.href = url;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={locked ? 'my-2 mx-auto max-w-md' : 'my-4 mx-auto max-w-md'}>
      <div className="bg-gradient-to-br from-brand-purple/8 to-brand-pink/8 border border-brand-purple/15 rounded-2xl p-6 text-center">
        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-brand-purple/10 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-purple">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-brand-dark mb-1">
          {locked ? "You\u2019ve used your 5 free messages" : 'Your personalized plan is ready'}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {locked
            ? 'Your personalized action plan is ready \u2014 including what to ask your doctor, which supplements actually help, and a week-by-week tracker.'
            : 'Unlock your full action plan, doctor visit scripts, and ongoing tracking.'}
        </p>
        <button
          onClick={handleStartTrial}
          disabled={loading}
          className="w-full py-3 px-6 bg-brand-pink text-white text-sm font-semibold rounded-xl hover:bg-brand-pink/90 transition-colors shadow-md shadow-brand-pink/20 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Start for $1 \u2014 first week'}
        </button>
        <p className="text-xs text-gray-400 mt-2">
          Then $14.99/month. Cancel anytime.
        </p>
        {!locked && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Not yet — keep chatting
          </button>
        )}
      </div>
    </div>
  );
}

export { TrialOfferCard };
