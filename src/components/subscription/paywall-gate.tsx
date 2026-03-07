'use client'

import { useState } from 'react'
import { UpgradePrompt } from './upgrade-prompt'

interface PaywallGateProps {
  tier: 'free' | 'premium'
  feature: string
  children: React.ReactNode
}

export function PaywallGate({ tier, feature, children }: PaywallGateProps) {
  const [showPrompt, setShowPrompt] = useState(true)

  if (tier === 'premium') {
    return <>{children}</>
  }

  if (!showPrompt) {
    return null
  }

  return <UpgradePrompt feature={feature} onClose={() => setShowPrompt(false)} />
}
