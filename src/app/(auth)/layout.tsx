import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MenoMind — Sign In',
  description: 'Sign in or create your MenoMind account.',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-cream px-4 py-12">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 text-center">
          <a href="/" aria-label="MenoMind home" className="inline-block">
            <h1 className="text-3xl font-bold tracking-tight text-brand-purple">
              Meno<span className="text-brand-pink">Mind</span>
            </h1>
            <p className="mt-1 text-sm text-brand-purple-light">
              Your AI-Powered Menopause Companion
            </p>
          </a>
        </div>

        {/* Auth card */}
        <div className="rounded-2xl border border-brand-cream-dark bg-white p-8 shadow-lg shadow-brand-purple/5">
          {children}
        </div>
      </div>
    </div>
  )
}
