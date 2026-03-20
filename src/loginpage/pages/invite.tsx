import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { deleteInvite, getInvites, getInvitesByInviter, regenerateInviteLink, updateInviteRole } from '@/services/firestoreService'
import { InviteForm } from '../components/InviteForm'
import { Card } from '../components/Card'
import { invites } from '../lib/db'
import { canInviteRole, getInvitableRoles } from '../lib/rbac'
import { Invite, Role } from '../types'

export default function InvitePage() {
  const { accessProfile, isAdmin, user } = useAuth()
  const [liveInvites, setLiveInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [actionMessage, setActionMessage] = useState('')
  const [workingId, setWorkingId] = useState<string | null>(null)

  const manageableRoles = useMemo(() => getInvitableRoles(accessProfile.role), [accessProfile.role])
  const fieldClassName =
    'border-slate-700 bg-slate-950/80 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-slate-950'
  const outlineButtonClassName =
    'border-slate-600 bg-slate-900/80 text-slate-100 hover:border-cyan-400/40 hover:bg-slate-800 hover:text-white'

  const loadInvites = async () => {
    setLoading(true)
    try {
      const canReadAllInvites =
        isAdmin ||
        ['SuperAdmin', 'Headmaster', 'DOS', 'DOD', 'Bursar', 'HOD', 'Teacher', 'ContentManager'].includes(
          accessProfile.role
        )

      const inviteData =
        canReadAllInvites || !user?.uid ? await getInvites() : await getInvitesByInviter(user.uid)

      setLiveInvites(inviteData)
    } catch (error) {
      console.error('Failed to load invites:', error)
      setLiveInvites([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvites()
  }, [accessProfile.role, isAdmin, user?.uid])

  const inviteList = liveInvites.length ? liveInvites : invites

  const canManageInvite = (invite: Invite) =>
    invite.status === 'pending' && (isAdmin || (user?.uid && invite.invitedByUid === user.uid))

  const handleRoleChange = async (inviteId: string, role: Role) => {
    setWorkingId(inviteId)
    setActionMessage('')
    try {
      await updateInviteRole({ inviteId, role })
      setActionMessage(`Invite role updated to ${role}.`)
      await loadInvites()
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Failed to update invite role.')
    } finally {
      setWorkingId(null)
    }
  }

  const handleRegenerate = async (inviteId: string) => {
    setWorkingId(inviteId)
    setActionMessage('')
    try {
      const invite = await regenerateInviteLink({ inviteId, origin: window.location.origin })
      await navigator.clipboard.writeText(invite.signupUrl || '')
      setActionMessage(`New invite link generated for ${invite.email} and copied to clipboard.`)
      await loadInvites()
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Failed to generate a new link.')
    } finally {
      setWorkingId(null)
    }
  }

  const handleDelete = async (inviteId: string) => {
    setWorkingId(inviteId)
    setActionMessage('')
    try {
      await deleteInvite(inviteId)
      setActionMessage('Invite deleted successfully.')
      await loadInvites()
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Failed to delete invite.')
    } finally {
      setWorkingId(null)
    }
  }

  const handleResendDraft = async (invite: Invite) => {
    window.location.href = `mailto:${invite.email}?subject=${encodeURIComponent('Nyagatare Secondary School account invitation')}&body=${encodeURIComponent(`You have been invited to join the NSS system as ${invite.role}.\n\nCreate your account here:\n${invite.signupUrl || ''}`)}`
  }

  return (
    <div className="space-y-6">
      <InviteForm onCreated={loadInvites} />
      <Card title="Pending Invite Ledger" description="Live invitation records stored in Firestore.">
        {actionMessage ? <p className="mb-4 text-sm text-cyan-200">{actionMessage}</p> : null}
        {loading ? <p className="mb-4 text-sm text-slate-400">Loading invites...</p> : null}
        <div className="space-y-4">
          {inviteList.map((invite) => (
            <div key={invite.id} className="rounded-2xl border border-slate-700 bg-slate-900/85 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-white">{invite.email}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Role: {invite.role} | invited by {invite.invitedBy}
                    {invite.invitedByRole ? ` (${invite.invitedByRole})` : ''} | expires {invite.expiresAt}
                  </p>
                  {invite.signupUrl ? <p className="mt-1 break-all text-xs text-cyan-300">{invite.signupUrl}</p> : null}
                </div>
                <div className="space-y-3">
                  <Badge className="bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10">{invite.status}</Badge>
                  {canManageInvite(invite) ? (
                    <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/60 p-3">
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Edit Role</p>
                        <Select
                          value={invite.role}
                          onValueChange={(value: Role) => handleRoleChange(invite.id, value)}
                          disabled={workingId === invite.id}
                        >
                          <SelectTrigger className={fieldClassName}>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent className="border-slate-700 bg-slate-950 text-slate-100">
                            {manageableRoles
                              .filter((role) => canInviteRole(accessProfile.role, role) || role === invite.role)
                              .map((role) => (
                                <SelectItem
                                  key={role}
                                  value={role}
                                  className="text-slate-100 focus:bg-slate-800 focus:text-white"
                                >
                                  {role}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className={outlineButtonClassName}
                          onClick={() => handleResendDraft(invite)}
                          disabled={workingId === invite.id}
                        >
                          Send Invitation
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className={outlineButtonClassName}
                          onClick={() => handleRegenerate(invite.id)}
                          disabled={workingId === invite.id}
                        >
                          Generate New Link
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-rose-500/30 bg-rose-950/40 text-rose-100 hover:border-rose-400/50 hover:bg-rose-900/60 hover:text-white"
                          onClick={() => handleDelete(invite.id)}
                          disabled={workingId === invite.id}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
