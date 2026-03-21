import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { getApplications, getApplicationsSettings, subscribeApplicationsSettings, updateApplication, updateApplicationsSettings } from '@/services/firestoreService'
import { Application } from '@/types/database'
import { Card } from '../components/Card'
import { admissionsDecisionStatuses, buildDecisionNote } from '../lib/admissions'

const statusOptions: Application['status'][] = [...admissionsDecisionStatuses]

export default function ApplicationsPage() {
  const { accessProfile } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Application['status']>('all')
  const [notes, setNotes] = useState('')
  const [communicationNotes, setCommunicationNotes] = useState('')
  const [decisionNotes, setDecisionNotes] = useState('')
  const [applicationsOpen, setApplicationsOpen] = useState(true)
  const [applicationsUpdatedAt, setApplicationsUpdatedAt] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState('')

  const loadApplications = async () => {
    const data = await getApplications()
    const settings = await getApplicationsSettings()
    setApplicationsOpen(settings.isOpen)
    setApplicationsUpdatedAt(settings.updated_at)
    setApplications(data)
    if (!selectedId && data[0]) {
      setSelectedId(data[0].id)
      setNotes(data[0].admin_notes || '')
      setCommunicationNotes(data[0].communication_notes || '')
      setDecisionNotes(data[0].decision_notes || '')
    }
  }

  useEffect(() => {
    loadApplications()
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeApplicationsSettings((settings) => {
      setApplicationsOpen(settings.isOpen)
      setApplicationsUpdatedAt(settings.updated_at)
    })

    return unsubscribe
  }, [])

  const filteredApplications = useMemo(
    () =>
      applications.filter((application) => {
        const fullName = `${application.first_name} ${application.last_name}`.toLowerCase()
        const matchesSearch =
          !search.trim() ||
          fullName.includes(search.toLowerCase()) ||
          application.application_id.toLowerCase().includes(search.toLowerCase()) ||
          (application.email || '').toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'all' || application.status === statusFilter
        return matchesSearch && matchesStatus
      }),
    [applications, search, statusFilter]
  )

  const selectedApplication = applications.find((application) => application.id === selectedId) || filteredApplications[0] || null

  useEffect(() => {
    if (selectedApplication) {
      setSelectedId(selectedApplication.id)
      setNotes(selectedApplication.admin_notes || '')
      setCommunicationNotes(selectedApplication.communication_notes || '')
      setDecisionNotes(selectedApplication.decision_notes || '')
    }
  }, [selectedApplication?.id])

  const handleStatusChange = async (status: Application['status']) => {
    if (!selectedApplication) return
    setWorking(true)
    setMessage('')
    try {
      const nextDecisionNote =
        status === 'admitted' || status === 'rejected'
          ? decisionNotes.trim() ||
            selectedApplication.decision_notes ||
            buildDecisionNote(
              status,
              `${selectedApplication.first_name} ${selectedApplication.last_name}`,
              selectedApplication.applying_grade
            )
          : selectedApplication.decision_notes

      await updateApplication(selectedApplication.id, {
        status,
        decision_notes: nextDecisionNote,
        reviewed_by: accessProfile.displayName,
        reviewed_at: new Date().toISOString(),
      })
      setDecisionNotes(nextDecisionNote || '')
      setMessage(`Application decision updated to ${status}.`)
      await loadApplications()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update application status.')
    } finally {
      setWorking(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!selectedApplication) return
    setWorking(true)
    setMessage('')
    try {
      await updateApplication(selectedApplication.id, {
        admin_notes: notes,
        communication_notes: communicationNotes,
        decision_notes: decisionNotes,
        last_contacted_by: accessProfile.displayName,
        last_contacted_at: communicationNotes.trim() ? new Date().toISOString() : selectedApplication.last_contacted_at,
      })
      setMessage('Application notes saved successfully.')
      await loadApplications()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save application notes.')
    } finally {
      setWorking(false)
    }
  }

  const handleToggleApplications = async () => {
    setWorking(true)
    setMessage('')
    try {
      const settings = await updateApplicationsSettings(!applicationsOpen)
      setApplicationsOpen(settings.isOpen)
      setApplicationsUpdatedAt(settings.updated_at)
      setMessage(settings.isOpen ? 'Application intake is now open.' : 'Application intake is now closed.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update application intake setting.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Admissions Workspace" description="Applications saved from the public form, review access for Admin, Headmaster, DOS, and Admissions Office.">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-900/85 p-4">
          <div>
            <p className="text-sm font-semibold text-white">Application Intake</p>
            <p className="mt-1 text-sm text-slate-300">
              {applicationsOpen ? 'Applications are currently open for new applicants.' : 'Applications are currently closed.'}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge className={applicationsOpen ? 'bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/15' : 'bg-rose-500/15 text-rose-200 hover:bg-rose-500/15'}>
                {applicationsOpen ? 'Open for applicants' : 'Closed to applicants'}
              </Badge>
              {applicationsUpdatedAt ? <span className="text-xs text-slate-400">Updated {new Date(applicationsUpdatedAt).toLocaleString()}</span> : null}
            </div>
          </div>
          <Button
            type="button"
            className={
              applicationsOpen
                ? 'bg-rose-500 text-white hover:bg-rose-400'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
            }
            onClick={handleToggleApplications}
            disabled={working}
          >
            {working ? 'Updating...' : applicationsOpen ? 'Close Applications' : 'Open Applications'}
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search applicant or application ID"
                className="border-slate-700 bg-slate-950/80 text-slate-100 placeholder:text-slate-500"
              />
              <Select value={statusFilter} onValueChange={(value: 'all' | Application['status']) => setStatusFilter(value)}>
                <SelectTrigger className="border-slate-700 bg-slate-950/80 text-slate-100">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-950 text-slate-100">
                  <SelectItem value="all" className="focus:bg-slate-800 focus:text-white">All statuses</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status} className="focus:bg-slate-800 focus:text-white">
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {filteredApplications.map((application) => (
                <button
                  key={application.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(application.id)
                    setNotes(application.admin_notes || '')
                    setCommunicationNotes(application.communication_notes || '')
                    setDecisionNotes(application.decision_notes || '')
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                    application.id === selectedId
                      ? 'border-cyan-400/40 bg-cyan-500/10'
                      : 'border-slate-700 bg-slate-900/85 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">{application.first_name} {application.last_name}</p>
                    <Badge className="bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10">{application.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-300">{application.application_id} | {application.applying_grade}</p>
                  <p className="mt-1 text-xs text-slate-400">{application.email || 'No applicant email submitted'}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            {selectedApplication ? (
              <div className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/85 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Application</p>
                    <h3 className="mt-2 text-2xl font-bold text-white">
                      {selectedApplication.first_name} {selectedApplication.last_name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-300">{selectedApplication.application_id} | {selectedApplication.applying_grade}</p>
                  </div>
                  <Select value={selectedApplication.status} onValueChange={handleStatusChange} disabled={working}>
                    <SelectTrigger className="w-44 border-slate-700 bg-slate-950/80 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-950 text-slate-100">
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status} className="focus:bg-slate-800 focus:text-white">
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 text-sm text-slate-300">
                    <p><span className="font-semibold text-white">Applicant Email:</span> {selectedApplication.email || 'Not provided'}</p>
                    <p><span className="font-semibold text-white">Phone:</span> {selectedApplication.phone || 'Not provided'}</p>
                    <p><span className="font-semibold text-white">Guardian:</span> {selectedApplication.guardian_name}</p>
                    <p><span className="font-semibold text-white">Guardian Phone:</span> {selectedApplication.guardian_phone}</p>
                    <p><span className="font-semibold text-white">Urubuto ID:</span> {selectedApplication.urubuto_id || 'Not provided'}</p>
                    <p><span className="font-semibold text-white">SDMS Code:</span> {selectedApplication.sdms_code || 'Not provided'}</p>
                    <p><span className="font-semibold text-white">Previous School:</span> {selectedApplication.previous_school}</p>
                  </div>
                  <div className="space-y-2 text-sm text-slate-300">
                    <p><span className="font-semibold text-white">Submitted:</span> {new Date(selectedApplication.created_at).toLocaleString()}</p>
                    <p><span className="font-semibold text-white">Last Reviewed:</span> {selectedApplication.reviewed_at ? new Date(selectedApplication.reviewed_at).toLocaleString() : 'Not reviewed yet'}</p>
                    <p><span className="font-semibold text-white">Reviewed By:</span> {selectedApplication.reviewed_by || 'Not assigned yet'}</p>
                    <p><span className="font-semibold text-white">Score:</span> {selectedApplication.score}%</p>
                    {selectedApplication.report_link ? (
                      <p className="break-all">
                        <span className="font-semibold text-white">Report Link:</span>{' '}
                        <a
                          href={selectedApplication.report_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-300 underline underline-offset-2 hover:text-cyan-200"
                        >
                          {selectedApplication.report_file_name || 'Open report document'}
                        </a>
                      </p>
                    ) : (
                      <p><span className="font-semibold text-white">Report Link:</span> Not provided</p>
                    )}
                    {selectedApplication.applicant_signup_url ? (
                      <p className="break-all"><span className="font-semibold text-white">Applicant Signup:</span> {selectedApplication.applicant_signup_url}</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-notes">Admissions Notes</Label>
                  <Textarea
                    id="admin-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="min-h-[120px] border-slate-700 bg-slate-950/80 text-slate-100 placeholder:text-slate-500"
                    placeholder="Review notes, evaluation comments, and internal admissions observations."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="communication-notes">Applicant Communication</Label>
                  <Textarea
                    id="communication-notes"
                    value={communicationNotes}
                    onChange={(event) => setCommunicationNotes(event.target.value)}
                    className="min-h-[120px] border-slate-700 bg-slate-950/80 text-slate-100 placeholder:text-slate-500"
                    placeholder="Track follow-up messages, calls, or next-step communication with the applicant."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="decision-notes">Decision Notes</Label>
                  <Textarea
                    id="decision-notes"
                    value={decisionNotes}
                    onChange={(event) => setDecisionNotes(event.target.value)}
                    className="min-h-[120px] border-slate-700 bg-slate-950/80 text-slate-100 placeholder:text-slate-500"
                    placeholder="Write the formal admissions decision note that the applicant should review."
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" onClick={handleSaveNotes} disabled={working}>
                    Save Changes
                  </Button>
                  {selectedApplication.email ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="border-slate-600 bg-slate-900/80 text-slate-100 hover:border-cyan-400/40 hover:bg-slate-800 hover:text-white"
                      asChild
                    >
                      <a
                        href={`mailto:${selectedApplication.email}?subject=${encodeURIComponent(`Application Update: ${selectedApplication.application_id}`)}&body=${encodeURIComponent(`Dear ${selectedApplication.first_name},\n\nWe are writing regarding your application ${selectedApplication.application_id}.\n\nStatus: ${selectedApplication.status}\n\nRegards,\n${accessProfile.displayName}`)}`}
                      >
                        Contact Applicant
                      </a>
                    </Button>
                  ) : null}
                </div>

                {message ? <p className="text-sm text-cyan-200">{message}</p> : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-700 bg-slate-900/85 p-5 text-slate-300">
                No applications found yet.
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
