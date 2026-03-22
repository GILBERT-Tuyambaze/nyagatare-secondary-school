import { FormEvent, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { auth } from '@/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { acceptInvite, getInviteByToken } from '@/services/firestoreService'
import { Invite } from '../types'

export default function InviteSignupPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user, signOut, loading: authLoading } = useAuth()
  const [invite, setInvite] = useState<Invite | null>(null)
  const [loadingInvite, setLoadingInvite] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fieldClassName =
    'border-slate-700 bg-slate-950/80 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-slate-950'
  const outlineButtonClassName =
    'border-slate-600 bg-slate-900/80 text-slate-100 hover:border-cyan-400/40 hover:bg-slate-800 hover:text-white'

  useEffect(() => {
    const loadInvite = async () => {
      if (!token) {
        setLoadingInvite(false)
        setError('Invite link is missing.')
        return
      }

      setLoadingInvite(true)
      const inviteData = await getInviteByToken(token)

      if (!inviteData) {
        setError('Invite not found.')
        setLoadingInvite(false)
        return
      }

      if (inviteData.status !== 'pending') {
        setError('This invite has already been used.')
        setLoadingInvite(false)
        return
      }

      if (new Date(inviteData.expiresAt).getTime() < Date.now()) {
        setError('This invite has expired.')
        setLoadingInvite(false)
        return
      }

      setInvite(inviteData)
      setDisplayName(inviteData.email.split('@')[0].replace(/[._-]+/g, ' '))
      setLoadingInvite(false)
    }

    loadInvite()
  }, [token])

  const handleCreateAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!invite || !token) return

    if (!displayName.trim()) {
      setError('Full name is required.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (user && user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      setError('Please sign out first, then open the invite link again to create the invited account.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      if (user && user.email?.toLowerCase() === invite.email.toLowerCase()) {
        await acceptInvite({
          token,
          uid: user.uid,
          email: user.email || invite.email,
          displayName: displayName.trim().replace(/\b\w/g, (character) => character.toUpperCase()),
        })

        setSuccess('This parent link has been added to your existing account. Redirecting to the NSS system...')
        setTimeout(() => navigate('/system', { replace: true }), 1200)
        return
      }

      const credentials = await createUserWithEmailAndPassword(auth, invite.email, password)
      await acceptInvite({
        token,
        uid: credentials.user.uid,
        email: credentials.user.email || invite.email,
        displayName: displayName.trim().replace(/\b\w/g, (character) => character.toUpperCase()),
      })

      setSuccess('Your account has been created successfully. Redirecting to the NSS system...')
      setTimeout(() => navigate('/system', { replace: true }), 1200)
    } catch (inviteError) {
      const message = inviteError instanceof Error ? inviteError.message : 'Failed to create your account.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loadingInvite) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Preparing your invite...</div>
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_35%),linear-gradient(160deg,_#020617_0%,_#111827_48%,_#0f172a_100%)] px-4 py-12 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-2xl items-center">
        <Card className="w-full border-white/10 bg-white/8 text-white shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl">Complete Your Invite</CardTitle>
            <CardDescription className="text-slate-300">
              Create your NSS account for the invited role using this one-time secure link and enter the system directly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {success ? (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            ) : null}

            {invite ? (
              <form onSubmit={handleCreateAccount} className="space-y-5">
                <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</p>
                    <p className="mt-2 font-medium text-white">{invite.email}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Invited Role</p>
                    <p className="mt-2 font-medium text-cyan-300">{invite.role}</p>
                  </div>
                  {invite.relatedStudentName ? (
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Linked Student</p>
                      <p className="mt-2 font-medium text-white">
                        {invite.relatedStudentName}
                        {invite.parentRelationshipType ? ` · ${invite.parentRelationshipType}` : ''}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display-name">Full Name</Label>
                  <Input
                    id="display-name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Your full name"
                    className={fieldClassName}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create your password"
                    className={fieldClassName}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm your password"
                    className={fieldClassName}
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" disabled={submitting}>
                    {submitting
                      ? user && user.email?.toLowerCase() === invite.email.toLowerCase()
                        ? 'Accepting Invite...'
                        : 'Creating Account...'
                      : user && user.email?.toLowerCase() === invite.email.toLowerCase()
                        ? 'Accept Invite On This Account'
                        : 'Create Account'}
                  </Button>
                  {user ? (
                    <Button type="button" variant="outline" className={outlineButtonClassName} onClick={signOut}>
                      Sign Out First
                    </Button>
                  ) : null}
                </div>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
