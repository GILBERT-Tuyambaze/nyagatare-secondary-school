import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { createInvite, getStudents } from '@/services/firestoreService'
import { Student } from '@/types/database'
import { getInvitableRoles } from '../lib/rbac'
import { Invite, ParentRelationshipType, Role } from '../types'
import { Card } from './Card'

export function InviteForm({ onCreated }: { onCreated: () => Promise<void> | void }) {
  const { accessProfile, user } = useAuth()
  const inviteRoles = useMemo(() => getInvitableRoles(accessProfile.role), [accessProfile.role])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>(inviteRoles[0] ?? 'Applicant')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [createdInvite, setCreatedInvite] = useState<Invite | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [parentRelationshipType, setParentRelationshipType] = useState<ParentRelationshipType>('mother')
  const fieldClassName =
    'border-slate-700 bg-slate-950/80 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-slate-950'
  const outlineButtonClassName =
    'border-slate-600 bg-slate-900/80 text-slate-100 hover:border-cyan-400/40 hover:bg-slate-800 hover:text-white'
  const isParentInvite = role === 'Parent' || role === 'ParentLeader'

  useEffect(() => {
    const loadStudents = async () => {
      if (!isParentInvite) return
      const studentRecords = await getStudents()
      setStudents(studentRecords)
    }

    void loadStudents()
  }, [isParentInvite])

  const inviterStudentRecord = useMemo(
    () => students.find((student) => student.email?.toLowerCase() === accessProfile.email?.toLowerCase()),
    [accessProfile.email, students]
  )

  const selectableStudents = useMemo(() => {
    if (!isParentInvite) return []
    if (accessProfile.role === 'Student') {
      return inviterStudentRecord ? [inviterStudentRecord] : []
    }
    return students
  }, [accessProfile.role, inviterStudentRecord, isParentInvite, students])

  useEffect(() => {
    if (!isParentInvite) {
      setSelectedStudentId('')
      return
    }

    if (accessProfile.role === 'Student') {
      setSelectedStudentId(inviterStudentRecord?.id || '')
      return
    }

    if (!selectableStudents.some((student) => student.id === selectedStudentId)) {
      setSelectedStudentId(selectableStudents[0]?.id || '')
    }
  }, [accessProfile.role, inviterStudentRecord?.id, isParentInvite, selectableStudents, selectedStudentId])

  const sendInviteEmail = async (invite: Invite) => {
    const response = await fetch('/api/invite-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inviteId: invite.id,
        email: invite.email,
        role: invite.role,
        inviterName: invite.invitedBy,
        signupUrl: invite.signupUrl,
        expiresAt: invite.expiresAt,
        relatedStudentName: invite.relatedStudentName,
        parentRelationshipType: invite.parentRelationshipType,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data?.error || 'Failed to send invitation email.')
    }
  }

  const handleSendInvite = async () => {
    if (!email.trim() || !role) {
      setMessage('Email and role are required.')
      return
    }

    if (!user?.uid) {
      setMessage('You must be signed in to create invites.')
      return
    }

    if (isParentInvite && !selectedStudentId) {
      setMessage('Select the student this parent will be linked to.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const selectedStudent = selectableStudents.find((student) => student.id === selectedStudentId)
      const invite = await createInvite({
        email: email.trim().toLowerCase(),
        role,
        invitedBy: accessProfile.displayName,
        invitedByUid: user.uid,
        invitedByRole: accessProfile.role,
        invitedByEmail: accessProfile.email,
        origin: window.location.origin,
        relatedStudentId: selectedStudent?.id,
        relatedStudentName: selectedStudent
          ? `${selectedStudent.first_name} ${selectedStudent.last_name}`
          : undefined,
        parentRelationshipType: isParentInvite ? parentRelationshipType : undefined,
      })
      setCreatedInvite(invite)
      setEmail('')
      setRole(inviteRoles[0] ?? 'Applicant')
      setParentRelationshipType('mother')
      try {
        await sendInviteEmail(invite)
        setMessage(`Invite created and email sent to ${invite.email}.`)
      } catch (emailError) {
        const emailMessage = emailError instanceof Error ? emailError.message : 'Email sending failed.'
        setMessage(`Invite created, but automatic email failed: ${emailMessage}`)
      }
      await onCreated()
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Failed to create invite.'
      setMessage(text)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="One-Time Invite Signup" description={`Live role-based invitations for ${accessProfile.role}.`}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="new.user@nyagataress.edu.rw"
            className={fieldClassName}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-role">Role</Label>
          <Select value={role} onValueChange={(value: Role) => setRole(value)}>
            <SelectTrigger id="invite-role" className={fieldClassName}>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent className="border-slate-700 bg-slate-950 text-slate-100">
              {inviteRoles.map((inviteRole) => (
                <SelectItem
                  key={inviteRole}
                  value={inviteRole}
                  className="text-slate-100 focus:bg-slate-800 focus:text-white"
                >
                  {inviteRole}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isParentInvite ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="invite-student">Linked Student</Label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger
                id="invite-student"
                className={fieldClassName}
                disabled={accessProfile.role === 'Student' && !!inviterStudentRecord}
              >
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-950 text-slate-100">
                {selectableStudents.map((student) => (
                  <SelectItem
                    key={student.id}
                    value={student.id}
                    className="text-slate-100 focus:bg-slate-800 focus:text-white"
                  >
                    {student.first_name} {student.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {accessProfile.role === 'Student' && !inviterStudentRecord ? (
              <p className="text-xs text-amber-300">
                Your signed-in email must match a student record before you can invite a parent.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent-relationship">Parent Type</Label>
            <Select
              value={parentRelationshipType}
              onValueChange={(value: ParentRelationshipType) => setParentRelationshipType(value)}
            >
              <SelectTrigger id="parent-relationship" className={fieldClassName}>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-950 text-slate-100">
                <SelectItem value="mother" className="text-slate-100 focus:bg-slate-800 focus:text-white">
                  Mother
                </SelectItem>
                <SelectItem value="father" className="text-slate-100 focus:bg-slate-800 focus:text-white">
                  Father
                </SelectItem>
                <SelectItem value="relative" className="text-slate-100 focus:bg-slate-800 focus:text-white">
                  Relative
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : null}

      <Button
        className="mt-4 bg-cyan-400 text-slate-950 hover:bg-cyan-300"
        onClick={handleSendInvite}
        disabled={loading || inviteRoles.length === 0}
      >
        {loading ? 'Creating Invite...' : 'Create Invite'}
      </Button>
      {inviteRoles.length === 0 ? (
        <p className="mt-3 text-sm text-amber-300">Your role does not have invitation permissions.</p>
      ) : null}
      {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}
      {createdInvite?.signupUrl ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-cyan-400/20 bg-slate-950/40 p-4">
          <p className="text-sm font-medium text-white">Invite link</p>
          <Input value={createdInvite.signupUrl} readOnly className={fieldClassName} />
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              className="bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25 hover:text-white"
              onClick={async () => {
                await navigator.clipboard.writeText(createdInvite.signupUrl || '')
                setMessage(`Invite created for ${createdInvite.email}. Link copied to clipboard.`)
              }}
            >
              Copy Link
            </Button>
            <Button type="button" variant="outline" className={outlineButtonClassName} asChild>
              <a
                href={`mailto:${createdInvite.email}?subject=${encodeURIComponent('Nyagatare Secondary School account invitation')}&body=${encodeURIComponent(`You have been invited to join the NSS system as ${createdInvite.role}.${createdInvite.relatedStudentName ? `\n\nLinked student: ${createdInvite.relatedStudentName}` : ''}${createdInvite.parentRelationshipType ? `\nRelationship: ${createdInvite.parentRelationshipType}` : ''}\n\nCreate your account here:\n${createdInvite.signupUrl}`)}`}
              >
                Open Email Draft
              </a>
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  )
}
