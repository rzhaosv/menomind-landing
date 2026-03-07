import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if onboarding is completed
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .single()

  // Get user data
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <AppShell
      user={{
        id: user.id,
        email: user.email ?? '',
        name: userData?.full_name ?? user.user_metadata?.full_name ?? '',
        tier: userData?.subscription_tier ?? 'free',
        onboardingCompleted: profile?.onboarding_completed ?? false,
      }}
    >
      {children}
    </AppShell>
  )
}
