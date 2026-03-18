'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

interface DoctorReportCardProps {
  tier: string
  daysLogged: number
}

function DoctorReportCard({ tier, daysLogged }: DoctorReportCardProps) {
  if (tier !== 'premium') return null

  const ready = daysLogged >= 3
  const daysNeeded = Math.max(0, 3 - daysLogged)

  return (
    <Card className={ready ? 'border-2 border-brand-purple/20 bg-gradient-to-br from-brand-purple/[0.04] to-brand-pink/[0.04]' : ''}>
      <CardContent className="py-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-purple/10 flex items-center justify-center shrink-0">
            <span className="text-lg">🩺</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-brand-dark">
              {ready ? 'Doctor Report Ready' : 'Doctor Report'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {ready
                ? 'Print a professional symptom summary for your next appointment.'
                : `Log ${daysNeeded} more day${daysNeeded !== 1 ? 's' : ''} to generate your report.`}
            </p>
            {ready ? (
              <Link
                href="/report"
                className="inline-block mt-2 text-xs font-semibold text-brand-purple hover:text-brand-purple-dark transition-colors"
              >
                View Report &rarr;
              </Link>
            ) : (
              <Link
                href="/track"
                className="inline-block mt-2 text-xs font-semibold text-gray-500 hover:text-brand-purple transition-colors"
              >
                Log symptoms &rarr;
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { DoctorReportCard }
