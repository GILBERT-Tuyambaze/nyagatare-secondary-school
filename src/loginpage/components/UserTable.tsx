import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { deleteAccessProfileRecord, updateAccessProfileRecord } from '@/services/firestoreService'
import { rolePermissions } from '../lib/rbac'
import { Role, SystemUser } from '../types'

const editableRoles: Role[] = [
  'Headmaster',
  'AdmissionsOfficer',
  'DOS',
  'DOD',
  'Bursar',
  'HOD',
  'Teacher',
  'Student',
  'StudentLeader',
  'Animator',
  'Animatress',
  'Parent',
  'ParentLeader',
  'ContentManager',
  'Applicant',
  'Guest',
]

type FormState = {
  fullName: string
  department: string
  status: SystemUser['status']
  role: Role
}

const buildFormState = (user: SystemUser): FormState => ({
  fullName: user.fullName,
  department: user.department,
  status: user.status,
  role: user.role,
})

export function UserTable({
  users,
  viewerRole,
  viewerUid,
  viewerEmail,
  onUsersChanged,
}: {
  users: SystemUser[]
  viewerRole: Role
  viewerUid?: string
  viewerEmail?: string | null
  onUsersChanged: () => Promise<void>
}) {
  const [query, setQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(users[0]?.id ?? null)
  const [formState, setFormState] = useState<FormState | null>(users[0] ? buildFormState(users[0]) : null)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const normalizedViewerEmail = viewerEmail?.toLowerCase() ?? ''
  const visibleUsers = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return users

    return users.filter((user) =>
      [user.fullName, user.email, user.role, user.department, user.status].some((value) =>
        value.toLowerCase().includes(search)
      )
    )
  }, [query, users])

  const selectedUser =
    visibleUsers.find((user) => user.id === selectedUserId) ??
    users.find((user) => user.id === selectedUserId) ??
    visibleUsers[0] ??
    users[0] ??
    null

  const isSelectedSelf =
    !!selectedUser &&
    (selectedUser.id === viewerUid || selectedUser.email.toLowerCase() === normalizedViewerEmail)

  const canManageUsers = viewerRole === 'SuperAdmin' || viewerRole === 'Headmaster'
  const canEditSelected = !!selectedUser && canManageUsers && !selectedUser.isProtected && !isSelectedSelf
  const canDeleteSelected = canEditSelected
  const canChangeRole = !!selectedUser && viewerRole === 'SuperAdmin' && !selectedUser.isProtected && !isSelectedSelf

  useEffect(() => {
    if (!selectedUser) {
      setFormState(null)
      return
    }

    setSelectedUserId(selectedUser.id)
    setFormState(buildFormState(selectedUser))
  }, [selectedUser?.id])

  const handleSave = async () => {
    if (!selectedUser || !formState || !canEditSelected) {
      return
    }

    setSaving(true)
    setMessage('')
    try {
      await updateAccessProfileRecord(selectedUser.id, {
        fullName: formState.fullName.trim(),
        displayName: formState.fullName.trim(),
        department: formState.department.trim(),
        status: formState.status,
        ...(canChangeRole
          ? {
              role: formState.role,
              permissions: rolePermissions[formState.role],
            }
          : {}),
        updated_at: new Date().toISOString(),
      } as Partial<SystemUser> & { updated_at: string })
      setMessage('User access profile updated.')
      await onUsersChanged()
    } catch (error) {
      console.error('Failed to update access profile:', error)
      setMessage('Could not update this user right now.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedUser || !canDeleteSelected) {
      return
    }

    const confirmed = window.confirm(
      `Delete the access profile for ${selectedUser.fullName}? The Firebase sign-in account will remain, but system access will be removed.`
    )

    if (!confirmed) {
      return
    }

    setDeleting(true)
    setMessage('')
    try {
      await deleteAccessProfileRecord(selectedUser.id)
      setMessage('User access profile deleted.')
      setSelectedUserId(null)
      setFormState(null)
      await onUsersChanged()
    } catch (error) {
      console.error('Failed to delete access profile:', error)
      setMessage('Could not delete this user right now.')
    } finally {
      setDeleting(false)
    }
  }

  const profileHint = isSelectedSelf
    ? 'Use My Profile for your own account changes.'
    : selectedUser?.isProtected
      ? 'This protected ghost account can only be managed by itself through My Profile.'
      : canManageUsers
        ? 'Headmaster and SuperAdmin can update non-protected user access here.'
        : 'You can inspect user access here, but only leadership managers can edit or delete records.'

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-white">Users and access profiles</p>
          <p className="text-sm text-slate-300">Search, inspect, and manage non-protected school accounts.</p>
        </div>
        <div className="w-full lg:max-w-sm">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email, role, department, or status"
            className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/70">
          <div className="max-h-[38rem] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Name</TableHead>
                  <TableHead className="text-slate-400">Role</TableHead>
                  <TableHead className="text-slate-400">Department</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleUsers.map((user) => {
                  const isActive = user.id === selectedUserId
                  const masked =
                    viewerRole !== 'SuperAdmin' &&
                    user.isGhost &&
                    user.id !== viewerUid &&
                    user.email.toLowerCase() !== normalizedViewerEmail

                  return (
                    <TableRow
                      key={user.id}
                      className={`cursor-pointer border-slate-800 ${isActive ? 'bg-cyan-500/10' : 'hover:bg-slate-900/80'}`}
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-white">{masked ? 'System Ghost' : user.fullName}</p>
                          <p className="text-xs text-slate-400">
                            {masked ? 'Protected system identity' : user.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-200">{user.role}</TableCell>
                      <TableCell className="text-slate-300">{user.department}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Badge className="bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10">{user.status}</Badge>
                          {user.isProtected ? (
                            <Badge className="bg-amber-500/15 text-amber-200 hover:bg-amber-500/15">Protected</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="self-start rounded-3xl border border-slate-800 bg-slate-950/80 p-5 xl:sticky xl:top-6 xl:max-h-[38rem] xl:overflow-auto">
          {selectedUser && formState ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-cyan-200">User Detail</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{selectedUser.fullName}</h3>
                  <p className="mt-1 text-sm text-slate-300">{selectedUser.email}</p>
                </div>
                <Badge className="bg-white/10 text-white hover:bg-white/10">{selectedUser.role}</Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Permissions</p>
                  <p className="mt-2 text-lg font-semibold text-white">{selectedUser.permissions.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Department</p>
                  <p className="mt-2 text-lg font-semibold text-white">{selectedUser.department}</p>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="space-y-2">
                  <Label className="text-slate-200" htmlFor="user-full-name">
                    Full name
                  </Label>
                  <Input
                    id="user-full-name"
                    value={formState.fullName}
                    disabled={!canEditSelected}
                    onChange={(event) => setFormState((current) => (current ? { ...current, fullName: event.target.value } : current))}
                    className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200" htmlFor="user-department">
                    Department
                  </Label>
                  <Input
                    id="user-department"
                    value={formState.department}
                    disabled={!canEditSelected}
                    onChange={(event) => setFormState((current) => (current ? { ...current, department: event.target.value } : current))}
                    className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Status</Label>
                  <Select
                    value={formState.status}
                    disabled={!canEditSelected}
                    onValueChange={(value: SystemUser['status']) =>
                      setFormState((current) => (current ? { ...current, status: value } : current))
                    }
                  >
                    <SelectTrigger className="border-slate-700 bg-slate-950 text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="invited">Invited</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Role</Label>
                  <Select
                    value={formState.role}
                    disabled={!canChangeRole}
                    onValueChange={(value: Role) =>
                      setFormState((current) => (current ? { ...current, role: value } : current))
                    }
                  >
                    <SelectTrigger className="border-slate-700 bg-slate-950 text-white">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
                      {editableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-400">
                    Role changes are reserved for the single superadmin account.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-100">
                <p>{profileHint}</p>
                <p className="mt-2 text-cyan-50/90">
                  Sign-in email is not editable here. Use the protected profile flow and Firebase Auth admin controls when that needs to change.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleSave}
                  disabled={!canEditSelected || saving}
                  className="bg-cyan-400 text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={!canDeleteSelected || deleting}
                  className="border-rose-500/40 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 hover:text-white disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
                >
                  {deleting ? 'Deleting...' : 'Delete access'}
                </Button>
                {isSelectedSelf ? (
                  <Button
                    asChild
                    variant="outline"
                    className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 hover:text-white"
                  >
                    <Link to="/system/profile">Open My Profile</Link>
                  </Button>
                ) : null}
              </div>

              {message ? <p className="text-sm text-cyan-200">{message}</p> : null}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-300">
              Select a user to inspect access details and management options.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
