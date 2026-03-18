import { createClient } from '@/lib/supabase/server'
import { getUserTier } from '@/lib/subscription/tier'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PrintReportButton } from '@/components/report/print-button'

export const metadata = {
  title: 'Doctor Visit Report — MenoMind',
}

export default async function DoctorReportPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const tier = await getUserTier(user.id)
  if (tier !== 'premium') redirect('/dashboard')

  // Fetch data (same pattern as /api/export/report)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const [
    { data: userData },
    { data: profileData },
    { data: symptomLogs },
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
    supabase
      .from('symptom_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo)
      .order('date', { ascending: true }),
  ])

  const logs = symptomLogs || []
  const totalDays = logs.length

  // Not enough data
  if (totalDays < 3) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-brand-purple/10 flex items-center justify-center">
          <span className="text-3xl">🩺</span>
        </div>
        <h1 className="text-2xl font-bold mb-3">Your Doctor Report is Almost Ready</h1>
        <p className="text-gray-600 mb-2">
          You need at least 3 days of symptom data to generate a meaningful report.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          You have <strong>{totalDays}</strong> day{totalDays !== 1 ? 's' : ''} logged.
          Log <strong>{3 - totalDays} more day{3 - totalDays !== 1 ? 's' : ''}</strong> to unlock your report.
        </p>
        <Link
          href="/track"
          className="inline-block bg-brand-purple text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-purple-dark transition-colors"
        >
          Log Today&apos;s Symptoms
        </Link>
      </div>
    )
  }

  // Calculate symptom averages
  const symptomTotals: Record<string, { total: number; count: number }> = {}
  for (const log of logs) {
    const symptoms = log.symptoms as Record<string, number>
    for (const [name, value] of Object.entries(symptoms)) {
      if (!symptomTotals[name]) symptomTotals[name] = { total: 0, count: 0 }
      symptomTotals[name].total += value
      symptomTotals[name].count++
    }
  }

  const symptomAverages = Object.entries(symptomTotals)
    .map(([name, { total, count }]) => ({
      name: name.replace(/_/g, ' '),
      average: Math.round((total / count) * 10) / 10,
      entries: count,
    }))
    .sort((a, b) => b.average - a.average)

  const severeSymptoms = symptomAverages.filter((s) => s.average >= 3)

  // Patient info
  const age = userData?.date_of_birth
    ? Math.floor(
        (Date.now() - new Date(userData.date_of_birth).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null

  const periodStart = logs[0]?.date
  const periodEnd = logs[logs.length - 1]?.date
  const generatedAt = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      {/* Print button — hidden in print */}
      <div className="print:hidden max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Back to Dashboard
        </Link>
        <PrintReportButton />
      </div>

      {/* Report content */}
      <div className="max-w-3xl mx-auto px-4 pb-12 print:max-w-none print:px-8 print:py-0">
        {/* Header */}
        <div className="border-b-2 border-brand-purple pb-6 mb-8 print:pb-4 print:mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-brand-dark print:text-xl">
                Symptom Assessment Report
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Prepared by MenoMind for healthcare provider review
              </p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>Generated: {generatedAt}</p>
              <p>
                Period: {periodStart} to {periodEnd}
              </p>
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <section className="mb-8 print:mb-6">
          <h2 className="text-lg font-bold text-brand-dark mb-3 print:text-base">
            Patient Information
          </h2>
          <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 print:bg-white print:border print:border-gray-300 print:rounded-none">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
              <p className="text-sm font-medium">{userData?.full_name || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Age</p>
              <p className="text-sm font-medium">{age ? `${age} years` : 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Reported Menopause Stage
              </p>
              <p className="text-sm font-medium capitalize">
                {userData?.menopause_stage?.replace(/-/g, ' ') || 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Days Tracked
              </p>
              <p className="text-sm font-medium">{totalDays} days over 30-day period</p>
            </div>
          </div>
        </section>

        {/* Most Concerning Symptoms */}
        {severeSymptoms.length > 0 && (
          <section className="mb-8 print:mb-6">
            <h2 className="text-lg font-bold text-brand-dark mb-3 print:text-base">
              Primary Concerns (Average Severity 3+/5)
            </h2>
            <div className="space-y-3">
              {severeSymptoms.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100 print:bg-white print:border-gray-300"
                >
                  <span className="text-sm font-medium capitalize">{s.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-red-100 rounded-full overflow-hidden print:bg-gray-200">
                      <div
                        className="h-full bg-red-400 rounded-full print:bg-gray-600"
                        style={{ width: `${(s.average / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-red-600 print:text-gray-800 w-12 text-right">
                      {s.average}/5
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Full Symptom Summary */}
        <section className="mb-8 print:mb-6">
          <h2 className="text-lg font-bold text-brand-dark mb-3 print:text-base">
            30-Day Symptom Summary
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 font-semibold text-gray-700">Symptom</th>
                <th className="text-center py-2 font-semibold text-gray-700">
                  Avg Severity
                </th>
                <th className="text-center py-2 font-semibold text-gray-700">
                  Days Reported
                </th>
                <th className="text-right py-2 font-semibold text-gray-700">Level</th>
              </tr>
            </thead>
            <tbody>
              {symptomAverages.map((s) => (
                <tr key={s.name} className="border-b border-gray-100">
                  <td className="py-2 capitalize">{s.name}</td>
                  <td className="py-2 text-center font-medium">{s.average}/5</td>
                  <td className="py-2 text-center text-gray-500">
                    {s.entries}/{totalDays}
                  </td>
                  <td className="py-2 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        s.average >= 4
                          ? 'bg-red-100 text-red-700 print:bg-white print:text-gray-800 print:border print:border-gray-400'
                          : s.average >= 3
                            ? 'bg-yellow-100 text-yellow-700 print:bg-white print:text-gray-700 print:border print:border-gray-300'
                            : 'bg-green-100 text-green-700 print:bg-white print:text-gray-600 print:border print:border-gray-200'
                      }`}
                    >
                      {s.average >= 4
                        ? 'Severe'
                        : s.average >= 3
                          ? 'Moderate'
                          : s.average >= 1
                            ? 'Mild'
                            : 'Minimal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Health Conditions & Medications */}
        {(profileData?.health_conditions || profileData?.medications) && (
          <section className="mb-8 print:mb-6">
            <h2 className="text-lg font-bold text-brand-dark mb-3 print:text-base">
              Reported Health Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profileData?.health_conditions &&
                Object.keys(profileData.health_conditions).length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 print:bg-white print:border print:border-gray-300">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                      Health Conditions
                    </p>
                    <p className="text-sm">
                      {Object.keys(profileData.health_conditions).join(', ')}
                    </p>
                  </div>
                )}
              {profileData?.medications &&
                Object.keys(profileData.medications).length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 print:bg-white print:border print:border-gray-300">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                      Current Medications
                    </p>
                    <p className="text-sm">
                      {Object.keys(profileData.medications).join(', ')}
                    </p>
                  </div>
                )}
            </div>
          </section>
        )}

        {/* Disclaimer */}
        <section className="mt-12 pt-6 border-t border-gray-200 print:mt-8 print:pt-4">
          <p className="text-xs text-gray-400 leading-relaxed">
            <strong>Disclaimer:</strong> This report is generated by MenoMind for
            informational purposes only. It is not a medical diagnosis and should not be
            used as a substitute for professional medical advice. The symptom data
            presented is self-reported by the patient through the MenoMind app. Please
            discuss all symptoms and concerns with a qualified healthcare provider.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Report generated by MenoMind (menomind.app) on {generatedAt}
          </p>
        </section>
      </div>
    </>
  )
}

