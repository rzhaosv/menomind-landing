import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface UpgradeBannerProps {
  tier: string;
}

const PREMIUM_BENEFITS = [
  'Unlimited AI conversations',
  'Advanced symptom analytics',
  'Personalized wellness plans',
  'Priority support',
];

function UpgradeBanner({ tier }: UpgradeBannerProps) {
  if (tier !== 'free') {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-brand-cream-dark to-brand-pink/10 border border-brand-pink/20">
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-brand-pink"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z"
                  clipRule="evenodd"
                />
              </svg>
              <h3 className="font-semibold text-brand-dark">
                Unlock Premium
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Get the most out of your menopause journey with premium features.
            </p>
            <ul className="space-y-1.5">
              {PREMIUM_BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-center gap-2 text-sm text-gray-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4 text-brand-purple flex-shrink-0"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-shrink-0">
            <Link href="/settings?tab=subscription">
              <Button variant="pink" size="md">
                Upgrade Now
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { UpgradeBanner };
