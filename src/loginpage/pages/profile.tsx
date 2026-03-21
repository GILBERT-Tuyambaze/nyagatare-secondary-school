import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { updateAccessProfileRecord } from '@/services/firestoreService'
import { Card } from '../components/Card'

export default function ProfilePage() {
  const { accessProfile, user, refreshAccessProfile, updateOwnAuthProfile } = useAuth()
  const [fullName, setFullName] = useState(accessProfile.fullName || accessProfile.displayName)
  const [department, setDepartment] = useState(accessProfile.department || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setFullName(accessProfile.fullName || accessProfile.displayName)
    setDepartment(accessProfile.department || '')
  }, [accessProfile.department, accessProfile.displayName, accessProfile.fullName])

  const handleSave = async () => {
    if (!user) {
      setMessage('You must be signed in to update your profile.')
      return
    }

    if (newPassword && newPassword !== confirmPassword) {
      setMessage('New password confirmation does not match.')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      await updateOwnAuthProfile({
        displayName: fullName,
        currentPassword,
        newPassword,
      })

      await updateAccessProfileRecord(user.uid, {
        fullName: fullName.trim(),
        displayName: fullName.trim(),
        department: department.trim(),
        updated_at: new Date().toISOString(),
      } as { fullName: string; displayName: string; department: string; updated_at: string })

      await refreshAccessProfile()

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage('Your profile has been updated.')
    } catch (error) {
      console.error('Failed to update profile:', error)
      setMessage(error instanceof Error ? error.message : 'Could not update your profile right now.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.8fr)]">
      <Card
        title="My Profile"
        description="Update your own name, department, and password. Role and sign-in email stay protected from self-service editing."
      >
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-slate-200" htmlFor="profile-name">
                Full name
              </Label>
              <Input
                id="profile-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200" htmlFor="profile-department">
                Department
              </Label>
              <Input
                id="profile-department"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-slate-200" htmlFor="profile-email">
                Sign-in email
              </Label>
              <Input
                id="profile-email"
                value={accessProfile.email ?? user?.email ?? ''}
                disabled
                className="border-slate-700 bg-slate-900/80 text-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200" htmlFor="profile-role">
                Role
              </Label>
              <Input
                id="profile-role"
                value={accessProfile.role}
                disabled
                className="border-slate-700 bg-slate-900/80 text-slate-300"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm font-medium text-white">Password update</p>
            <p className="mt-1 text-sm text-slate-300">
              Leave these fields empty if you only want to update your profile details.
            </p>
            <div className="mt-4 grid gap-4">
              <div className="space-y-2">
                <Label className="text-slate-200" htmlFor="current-password">
                  Current password
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-400"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-200" htmlFor="new-password">
                    New password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200" htmlFor="confirm-password">
                    Confirm new password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
            >
              {saving ? 'Saving profile...' : 'Save profile'}
            </Button>
            {message ? <p className="text-sm text-cyan-200">{message}</p> : null}
          </div>
        </div>
      </Card>

      <Card
        title="Security and Visibility"
        description="Protected rules for account safety, leadership workflows, and the single ghost superadmin."
      >
        <div className="space-y-4 text-sm text-slate-300">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="font-medium text-white">Profile scope</p>
            <p className="mt-2">
              Every user can update their own name, department, and password here. Role and sign-in email remain outside normal self-service.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="font-medium text-white">Leadership access</p>
            <p className="mt-2">
              Headmaster and superadmin can manage non-protected access profiles in the users workspace. Protected ghost accounts stay out of normal editing and deletion flows.
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-cyan-100">
            <p className="font-medium text-white">Ghost superadmin</p>
            <p className="mt-2">
              The single superadmin account stays protected and can only adjust its own profile from this page.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
