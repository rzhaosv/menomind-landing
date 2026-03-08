'use client';

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
  context?: {
    headline?: string;
    body?: string;
    icon?: string;
  };
}

const FEATURES_FREE = [
  '5 AI messages per day',
  'Daily symptom logging',
  '7-day trends',
  '1 wellness plan',
];

const FEATURES_PREMIUM = [
  'Unlimited AI conversations',
  'Full symptom history & analytics',
  'All 5 personalized wellness plans',
  'Doctor visit prep reports',
  'Weekly AI insights',
  'Priority support',
];

const TESTIMONIAL = {
  quote: 'MenoMind helped me finally understand my hot flash triggers. The AI chat alone is worth the subscription.',
  name: 'Jennifer',
  age: 52,
};

function PricingModal({ open, onClose, context }: PricingModalProps) {
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  const [loading, setLoading] = useState(false);

  const priceId = billingCycle === 'annual'
    ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL
    : process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY;

  async function handleCheckout() {
    if (!priceId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start checkout. Please try again.');
        setLoading(false);
      }
    } catch {
      alert('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <Dialog open onClose={onClose} title="">
      <div className="max-h-[85vh] overflow-y-auto">
        {/* Context-specific header */}
        {context ? (
          <div className="text-center mb-6">
            {context.icon && (
              <span className="text-4xl block mb-3">{context.icon}</span>
            )}
            <h3 className="text-xl font-bold text-brand-dark mb-2">
              {context.headline || 'Upgrade to Premium'}
            </h3>
            <p className="text-sm text-gray-600">{context.body}</p>
          </div>
        ) : (
          <div className="text-center mb-6">
            <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-brand-dark mb-1">
              Unlock the Full Experience
            </h3>
            <p className="text-sm text-gray-500">
              Join 2,000+ women managing menopause with confidence
            </p>
          </div>
        )}

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-brand-purple text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              billingCycle === 'annual'
                ? 'bg-brand-purple text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Annual
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              billingCycle === 'annual'
                ? 'bg-white/20 text-white'
                : 'bg-brand-pink/10 text-brand-pink'
            }`}>
              Save $80
            </span>
          </button>
        </div>

        {/* Price display */}
        <div className="text-center mb-5">
          {billingCycle === 'annual' ? (
            <>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-sm text-gray-400 line-through">$14.99/mo</span>
                <span className="text-3xl font-bold text-brand-dark">$8.25</span>
                <span className="text-sm text-gray-500">/mo</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Billed as $99/year</p>
            </>
          ) : (
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold text-brand-dark">$14.99</span>
              <span className="text-sm text-gray-500">/mo</span>
            </div>
          )}
        </div>

        {/* Feature comparison */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Free</p>
            <ul className="space-y-1.5">
              {FEATURES_FREE.map((f) => (
                <li key={f} className="text-xs text-gray-500 flex items-start gap-1.5">
                  <span className="text-gray-300 mt-0.5">-</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-3 rounded-xl bg-brand-purple/5 border-2 border-brand-purple/20">
            <p className="text-xs font-semibold text-brand-purple mb-2 uppercase tracking-wide">Premium</p>
            <ul className="space-y-1.5">
              {FEATURES_PREMIUM.map((f) => (
                <li key={f} className="text-xs text-gray-700 flex items-start gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B3F8D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Start 7-Day Free Trial'}
        </Button>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-gray-400">
          <span>7-day free trial</span>
          <span>Cancel anytime</span>
          <span>14-day money-back</span>
        </div>

        {/* Testimonial */}
        <div className="mt-5 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className="text-yellow-400 text-xs">&#9733;</span>
            ))}
          </div>
          <p className="text-xs text-gray-600 italic">
            &quot;{TESTIMONIAL.quote}&quot;
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            {TESTIMONIAL.name}, {TESTIMONIAL.age}
          </p>
        </div>

        {/* Maybe later */}
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export { PricingModal };
