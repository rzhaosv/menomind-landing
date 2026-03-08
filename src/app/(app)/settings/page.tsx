'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ProfileData {
  full_name: string
  email: string
  date_of_birth: string
  menopause_stage: string
  health_conditions: string[]
  medications: string[]
  goals: string[]
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const json = await res.json()
        const userData = json.data || json.user || {}
        const profileData = userData.user_profiles?.[0] || userData.user_profiles || json.profile || {}
        setProfile({
          full_name: userData.full_name || '',
          email: userData.email || '',
          date_of_birth: userData.date_of_birth || '',
          menopause_stage: userData.menopause_stage || 'unsure',
          health_conditions: profileData.health_conditions
            ? (Array.isArray(profileData.health_conditions) ? profileData.health_conditions : Object.keys(profileData.health_conditions))
            : [],
          medications: profileData.medications
            ? (Array.isArray(profileData.medications) ? profileData.medications : Object.keys(profileData.medications))
            : [],
          goals: profileData.goals || [],
        })
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: profile.full_name,
          date_of_birth: profile.date_of_birth || null,
          menopause_stage: profile.menopause_stage,
        }),
      })

      if (res.ok) {
        setMessage('Profile updated successfully!')
      } else {
        setMessage('Failed to update profile. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleExportData() {
    const res = await fetch('/api/export/data')
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'menomind-data-export.json'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently deleted.'
    )
    if (!confirmed) return

    const doubleConfirm = window.confirm(
      'This is your last chance. Delete your account and all data permanently?'
    )
    if (!doubleConfirm) return

    const res = await fetch('/api/user/account', { method: 'DELETE' })
    if (res.ok) {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-brand-dark">Settings</h1>

      {/* Profile Form */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              className="input-field"
              value={profile?.full_name || ''}
              onChange={(e) =>
                setProfile((p) => p && { ...p, full_name: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="input-field bg-gray-50"
              value={profile?.email || ''}
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              className="input-field"
              value={profile?.date_of_birth || ''}
              onChange={(e) =>
                setProfile((p) => p && { ...p, date_of_birth: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Menopause Stage
            </label>
            <select
              className="input-field"
              value={profile?.menopause_stage || 'unsure'}
              onChange={(e) =>
                setProfile(
                  (p) => p && { ...p, menopause_stage: e.target.value }
                )
              }
            >
              <option value="pre">Pre-menopause</option>
              <option value="peri">Perimenopause</option>
              <option value="post">Post-menopause</option>
              <option value="unsure">Not sure</option>
            </select>
          </div>

          {message && (
            <p
              className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}
            >
              {message}
            </p>
          )}

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Subscription */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Subscription</h2>
        <Link
          href="/settings/subscription"
          className="text-brand-purple hover:underline font-medium"
        >
          Manage your subscription →
        </Link>
      </div>

      {/* Data */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Your Data</h2>
        <div className="space-y-3">
          <button
            onClick={handleExportData}
            className="btn-secondary text-sm w-full"
          >
            Export All Data (JSON)
          </button>
        </div>
      </div>

      {/* Account Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <div className="space-y-3">
          <button onClick={handleSignOut} className="btn-secondary text-sm w-full">
            Sign Out
          </button>
          <button
            onClick={handleDeleteAccount}
            className="w-full px-6 py-3 rounded-xl border-2 border-red-300 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors"
          >
            Delete Account
          </button>
          <p className="text-xs text-gray-500">
            This permanently deletes your account and all associated data.
          </p>
        </div>
      </div>
    </div>
  )
}
