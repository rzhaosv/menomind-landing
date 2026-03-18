import type { Metadata } from 'next'
import { Suspense } from 'react'
import SignupForm from '@/components/auth/signup-form'

export const metadata: Metadata = {
  title: 'Create Your Account',
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
