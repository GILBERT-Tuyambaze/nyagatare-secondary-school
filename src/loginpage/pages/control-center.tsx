import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, DollarSign, FileText, Mail, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  createDonation,
  createEvent,
  deleteApplication,
  deleteDonation,
  deleteEvent,
  deleteNewsletterSubscriber,
  getAccessProfiles,
  getApplications,
  getDashboardStats,
  getDonations,
  getEvents,
  getNewsletterSubscribers,
  updateApplication,
  updateDonation,
  updateEvent,
  updateNewsletterSubscriber,
} from '@/services/firestoreService'
import { Application, Donation, Event, NewsletterSubscriber } from '@/types/database'
import { Card } from '../components/Card'
import { SystemUser } from '../types'

const fieldClassName = 'border-slate-700 bg-slate-950 text-white placeholder:text-slate-400'

const emptyEventDraft = {
  title: '',
  description: '',
  event_date: '',
  category: 'academic' as Event['category'],
  status: 'upcoming' as Event['status'],
  location: '',
}

const emptyDonationDraft = {
  donor_name: '',
  amount: '',
  donation_type: 'general' as Donation['donation_type'],
  payment_status: 'completed' as Donation['payment_status'],
  donor_email: '',
  donor_phone: '',
  payment_method: '',
  payment_provider: '' as Donation['payment_provider'] | '',
  payment_reference: '',
  payment_link: '',
  message: '',
  is_anonymous: false,
}

export default function ControlCenterPage() {
  const { accessProfile } = useAuth()
  const [users, setUsers] = useState<SystemUser[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [savingMessage, setSavingMessage] = useState('')
  const [editingApplicationId, setEditingApplicationId] = useState<string | null>(null)
  const [applicationStatusDraft, setApplicationStatusDraft] = useState<Application['status']>('pending')
  const [applicationNoteDraft, setApplicationNoteDraft] = useState('')
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [eventDraft, setEventDraft] = useState(emptyEventDraft)
  const [editingDonationId, setEditingDonationId] = useState<string | null>(null)
  const [donationDraft, setDonationDraft] = useState(emptyDonationDraft)
  const [donationStatusFilter, setDonationStatusFilter] = useState<'all' | Donation['payment_status']>('all')

  const canManageApplications = accessProfile.permissions.includes('view_reports')
  const canManageEvents =
    accessProfile.permissions.includes('manage_content') ||
    accessProfile.permissions.includes('publish_news') ||
    ['SuperAdmin', 'Headmaster', 'DOS', 'DOD', 'HOD', 'ContentManager'].includes(accessProfile.role)
  const canManageDonations = accessProfile.permissions.includes('manage_finance') || ['SuperAdmin', 'Headmaster'].includes(accessProfile.role)
  const canManageSubscribers =
    accessProfile.permissions.includes('manage_content') ||
    accessProfile.permissions.includes('publish_news') ||
    ['SuperAdmin', 'Headmaster', 'DOS', 'DOD', 'HOD', 'ContentManager'].includes(accessProfile.role)

  const loadData = async () => {
    setLoading(true)
    try {
      const [userData, applicationData, eventData, donationData, subscriberData] = await Promise.all([
        getAccessProfiles(),
        getApplications(),
        getEvents(),
        getDonations(),
        getNewsletterSubscribers(),
      ])
      setUsers(userData)
      setApplications(applicationData)
      setEvents(eventData)
      setDonations(donationData)
      setSubscribers(subscriberData)
    } catch (error) {
      console.error('Failed to load control center data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const overview = useMemo(() => {
    const totalDonations = donations
      .filter((donation) => donation.payment_status === 'completed')
      .reduce((sum, donation) => sum + donation.amount, 0)

    return {
      totalApplications: applications.length,
      pendingApplications: applications.filter((application) => ['pending', 'review'].includes(application.status)).length,
      upcomingEvents: events.filter((event) => event.status === 'upcoming').length,
      totalDonations,
      totalStudents: users.filter((user) => user.role === 'Student').length,
      totalSubscribers: subscribers.length,
    }
  }, [applications, donations, events, subscribers.length, users])

  const resetEventDraft = () => {
    setEditingEventId(null)
    setEventDraft(emptyEventDraft)
  }

  const resetDonationDraft = () => {
    setEditingDonationId(null)
    setDonationDraft(emptyDonationDraft)
  }

  const handleSaveApplication = async (applicationId: string) => {
    setSavingMessage('')
    try {
      await updateApplication(applicationId, {
        status: applicationStatusDraft,
        admin_notes: applicationNoteDraft.trim(),
      })
      setEditingApplicationId(null)
      setApplicationStatusDraft('pending')
      setApplicationNoteDraft('')
      setSavingMessage('Application updated.')
      await loadData()
    } catch (error) {
      console.error('Failed to update application:', error)
      setSavingMessage('Could not update the application right now.')
    }
  }

  const handleDeleteApplication = async (applicationId: string) => {
    if (!window.confirm('Delete this application record?')) return
    setSavingMessage('')
    try {
      await deleteApplication(applicationId)
      setSavingMessage('Application deleted.')
      await loadData()
    } catch (error) {
      console.error('Failed to delete application:', error)
      setSavingMessage('Could not delete the application right now.')
    }
  }

  const handleSaveEvent = async () => {
    setSavingMessage('')
    try {
      if (editingEventId) {
        await updateEvent(editingEventId, {
          title: eventDraft.title.trim(),
          description: eventDraft.description.trim(),
          event_date: eventDraft.event_date,
          category: eventDraft.category,
          status: eventDraft.status,
          location: eventDraft.location.trim(),
        })
      } else {
        await createEvent({
          title: eventDraft.title.trim(),
          description: eventDraft.description.trim(),
          event_date: eventDraft.event_date,
          category: eventDraft.category,
          status: eventDraft.status,
          current_attendees: 0,
          location: eventDraft.location.trim(),
        })
      }
      resetEventDraft()
      setSavingMessage(`Event ${editingEventId ? 'updated' : 'created'}.`)
      await loadData()
    } catch (error) {
      console.error('Failed to save event:', error)
      setSavingMessage('Could not save the event right now.')
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Delete this event?')) return
    setSavingMessage('')
    try {
      await deleteEvent(eventId)
      if (editingEventId === eventId) resetEventDraft()
      setSavingMessage('Event deleted.')
      await loadData()
    } catch (error) {
      console.error('Failed to delete event:', error)
      setSavingMessage('Could not delete the event right now.')
    }
  }

  const handleSaveDonation = async () => {
    setSavingMessage('')
    try {
      const payload = {
        donor_name: donationDraft.donor_name.trim(),
        amount: Number(donationDraft.amount),
        donation_type: donationDraft.donation_type,
        payment_status: donationDraft.payment_status,
        donor_email: donationDraft.donor_email.trim() || undefined,
        donor_phone: donationDraft.donor_phone.trim() || undefined,
        payment_method: donationDraft.payment_method || undefined,
        payment_provider: (donationDraft.payment_provider || undefined) as Donation['payment_provider'] | undefined,
        payment_reference: donationDraft.payment_reference.trim() || undefined,
        payment_link: donationDraft.payment_link.trim() || undefined,
        message: donationDraft.message.trim() || undefined,
        currency: 'RWF',
        is_anonymous: donationDraft.is_anonymous,
      }

      if (editingDonationId) {
        await updateDonation(editingDonationId, payload)
      } else {
        await createDonation(payload)
      }
      resetDonationDraft()
      setSavingMessage(`Donation ${editingDonationId ? 'updated' : 'recorded'}.`)
      await loadData()
    } catch (error) {
      console.error('Failed to save donation:', error)
      setSavingMessage('Could not save the donation right now.')
    }
  }

  const filteredDonations =
    donationStatusFilter === 'all'
      ? donations
      : donations.filter((d) => d.payment_status === donationStatusFilter)

  const handleExportDonations = () => {
    const rows = filteredDonations.map((d) => ({
      donor_name: d.donor_name,
      donor_email: d.donor_email ?? '',
      donor_phone: d.donor_phone ?? '',
      amount: d.amount,
      currency: d.currency,
      donation_type: d.donation_type,
      payment_status: d.payment_status,
      payment_method: d.payment_method ?? '',
      payment_provider: d.payment_provider ?? '',
      payment_reference: d.payment_reference ?? '',
      payment_link: d.payment_link ?? '',
      receipt_url: d.receipt_url ?? '',
      message: d.message ?? '',
      created_at: d.created_at,
      updated_at: d.updated_at,
    }))

    const header = Object.keys(rows[0] || { donor_name: '' }).join(',')
    const csvBody = rows
      .map((r) =>
        Object.values(r)
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n')

    const blob = new Blob([`${header}\n${csvBody}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `nss-donations-${donationStatusFilter}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDeleteDonation = async (donationId: string) => {
    if (!window.confirm('Delete this donation record?')) return
    setSavingMessage('')
    try {
      await deleteDonation(donationId)
      if (editingDonationId === donationId) resetDonationDraft()
      setSavingMessage('Donation deleted.')
      await loadData()
    } catch (error) {
      console.error('Failed to delete donation:', error)
      setSavingMessage('Could not delete the donation right now.')
    }
  }

  const handleSubscriberStatus = async (subscriber: NewsletterSubscriber, status: 'subscribed' | 'unsubscribed') => {
    setSavingMessage('')
    try {
      await updateNewsletterSubscriber(subscriber.id, {
        status,
        unsubscribed_at: status === 'unsubscribed' ? new Date().toISOString() : null,
      })
      setSavingMessage(`Subscriber marked ${status}.`)
      await loadData()
    } catch (error) {
      console.error('Failed to update subscriber:', error)
      setSavingMessage('Could not update the subscriber right now.')
    }
  }

  const handleDeleteSubscriber = async (subscriberId: string) => {
    if (!window.confirm('Delete this subscriber record?')) return
    setSavingMessage('')
    try {
      await deleteNewsletterSubscriber(subscriberId)
      setSavingMessage('Subscriber deleted.')
      await loadData()
    } catch (error) {
      console.error('Failed to delete subscriber:', error)
      setSavingMessage('Could not delete the subscriber right now.')
    }
  }

  if (loading) {
    return (
      <Card title="Staff/Admin Control Center" description="Loading live operations, records, and role-aware management lanes.">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-300">Loading control center...</div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card title="Institution Overview" description="Live figures now driven by the database records the control center is managing.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            { label: 'Applications', value: overview.totalApplications, note: `${overview.pendingApplications} pending review`, icon: FileText },
            { label: 'Students', value: overview.totalStudents, note: 'Student access profiles currently in the live system', icon: Users },
            { label: 'Upcoming Events', value: overview.upcomingEvents, note: 'Calendar items still marked upcoming', icon: Calendar },
            { label: 'Completed Donations', value: `RWF ${overview.totalDonations.toLocaleString()}`, note: 'Total confirmed donations received', icon: DollarSign },
            { label: 'Newsletter Audience', value: overview.totalSubscribers, note: 'Subscribers collected from the public website', icon: Mail },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-400">{item.label}</p>
                    <p className="mt-2 text-3xl font-bold text-white">{item.value}</p>
                    <p className="mt-2 text-sm text-slate-300">{item.note}</p>
                  </div>
                  <div className="rounded-full bg-cyan-500/10 p-3 text-cyan-200">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {savingMessage ? <p className="text-sm text-cyan-200">{savingMessage}</p> : null}

      <Card title="Live Command Team" description="Current access profiles loaded from the database rather than static seed cards.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {users.slice(0, 9).map((user) => (
            <div key={user.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{user.fullName}</p>
                  <p className="mt-1 text-sm text-slate-400">{user.department}</p>
                </div>
                <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">{user.role}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {canManageApplications ? (
        <Card title="Application Decisions" description="Review, update, and remove admissions records directly from the control center.">
          <div className="space-y-4">
            {applications.slice(0, 8).map((application) => (
              <div key={application.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-white">{application.first_name} {application.last_name}</p>
                    <p className="mt-1 text-sm text-slate-400">{application.applying_grade}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">{application.status}</Badge>
                    <Button
                      variant="outline"
                      className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800 hover:text-white"
                      onClick={() => {
                        setEditingApplicationId(application.id)
                        setApplicationStatusDraft(application.status)
                        setApplicationNoteDraft(application.admin_notes || '')
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      className="border-rose-500/40 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 hover:text-white"
                      onClick={() => void handleDeleteApplication(application.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                {editingApplicationId === application.id ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)_auto]">
                    <Select value={applicationStatusDraft} onValueChange={(value: Application['status']) => setApplicationStatusDraft(value)}>
                      <SelectTrigger className={fieldClassName}>
                        <SelectValue placeholder="Decision" />
                      </SelectTrigger>
                      <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="admitted">Admitted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="waitlist">Waitlist</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      value={applicationNoteDraft}
                      onChange={(event) => setApplicationNoteDraft(event.target.value)}
                      placeholder="Leadership notes"
                      className={fieldClassName}
                    />
                    <div className="flex flex-col gap-2">
                      <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" onClick={() => void handleSaveApplication(application.id)}>
                        Save
                      </Button>
                      <Button variant="outline" className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800 hover:text-white" onClick={() => setEditingApplicationId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {canManageEvents ? (
        <Card title="Events Management" description="Create, edit, and remove live event records from the control center.">
          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div>
                <p className="font-semibold text-white">{editingEventId ? 'Edit event' : 'Create event'}</p>
                <p className="mt-1 text-sm text-slate-400">Keep calendar records current for staff, students, and parents.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Title</Label>
                <Input value={eventDraft.title} onChange={(event) => setEventDraft((current) => ({ ...current, title: event.target.value }))} className={fieldClassName} />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Description</Label>
                <Textarea value={eventDraft.description} onChange={(event) => setEventDraft((current) => ({ ...current, description: event.target.value }))} className={fieldClassName} />
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-2">
                  <Label className="text-slate-200">Date</Label>
                  <Input type="date" value={eventDraft.event_date} onChange={(event) => setEventDraft((current) => ({ ...current, event_date: event.target.value }))} className={fieldClassName} />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Category</Label>
                  <Select value={eventDraft.category} onValueChange={(value: Event['category']) => setEventDraft((current) => ({ ...current, category: value }))}>
                    <SelectTrigger className={fieldClassName}><SelectValue /></SelectTrigger>
                    <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="cultural">Cultural</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="ceremony">Ceremony</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-2">
                  <Label className="text-slate-200">Status</Label>
                  <Select value={eventDraft.status} onValueChange={(value: Event['status']) => setEventDraft((current) => ({ ...current, status: value }))}>
                    <SelectTrigger className={fieldClassName}><SelectValue /></SelectTrigger>
                    <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Location</Label>
                  <Input value={eventDraft.location} onChange={(event) => setEventDraft((current) => ({ ...current, location: event.target.value }))} className={fieldClassName} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" onClick={() => void handleSaveEvent()}>
                  {editingEventId ? 'Save event' : 'Create event'}
                </Button>
                {editingEventId ? (
                  <Button variant="outline" className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800 hover:text-white" onClick={resetEventDraft}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="space-y-3">
              {events.slice(0, 10).map((event) => (
                <div key={event.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{event.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{new Date(event.event_date).toLocaleDateString()} · {event.category}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">{event.status}</Badge>
                      <Button variant="outline" className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800 hover:text-white" onClick={() => {
                        setEditingEventId(event.id)
                        setEventDraft({
                          title: event.title,
                          description: event.description || '',
                          event_date: event.event_date,
                          category: event.category,
                          status: event.status,
                          location: event.location || '',
                        })
                      }}>
                        Edit
                      </Button>
                      <Button variant="outline" className="border-rose-500/40 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 hover:text-white" onClick={() => void handleDeleteEvent(event.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : null}

      {canManageDonations ? (
        <Card title="Donation Records" description="Record, correct, and remove finance contributions from the live database.">
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-slate-200">Filter status</Label>
              <Select value={donationStatusFilter} onValueChange={(value: 'all' | Donation['payment_status']) => setDonationStatusFilter(value)}>
                <SelectTrigger className={fieldClassName}><SelectValue /></SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800 hover:text-white" onClick={handleExportDonations}>
              Export CSV
            </Button>
          </div>
          <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="font-semibold text-white">{editingDonationId ? 'Edit donation' : 'Record donation'}</p>
              <div className="space-y-2">
                <Label className="text-slate-200">Donor</Label>
                <Input value={donationDraft.donor_name} onChange={(event) => setDonationDraft((current) => ({ ...current, donor_name: event.target.value }))} className={fieldClassName} />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Amount (RWF)</Label>
                <Input value={donationDraft.amount} onChange={(event) => setDonationDraft((current) => ({ ...current, amount: event.target.value }))} className={fieldClassName} />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Donor email</Label>
                <Input value={donationDraft.donor_email} onChange={(event) => setDonationDraft((current) => ({ ...current, donor_email: event.target.value }))} className={fieldClassName} />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Donor phone</Label>
                <Input value={donationDraft.donor_phone} onChange={(event) => setDonationDraft((current) => ({ ...current, donor_phone: event.target.value }))} className={fieldClassName} />
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-2">
                  <Label className="text-slate-200">Type</Label>
                  <Select value={donationDraft.donation_type} onValueChange={(value: Donation['donation_type']) => setDonationDraft((current) => ({ ...current, donation_type: value }))}>
                    <SelectTrigger className={fieldClassName}><SelectValue /></SelectTrigger>
                    <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="scholarship">Scholarship</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Payment status</Label>
                  <Select value={donationDraft.payment_status} onValueChange={(value: Donation['payment_status']) => setDonationDraft((current) => ({ ...current, payment_status: value }))}>
                    <SelectTrigger className={fieldClassName}><SelectValue /></SelectTrigger>
                    <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Payment method</Label>
                  <Select
                    value={donationDraft.payment_method}
                    onValueChange={(value) =>
                      setDonationDraft((current) => ({
                        ...current,
                        payment_method: value,
                        payment_provider:
                          value === 'flutterwave'
                            ? 'flutterwave'
                            : value === 'bank_transfer'
                              ? 'bank_transfer'
                              : value === 'cash'
                                ? 'cash'
                                : 'other',
                      }))
                    }
                  >
                    <SelectTrigger className={fieldClassName}><SelectValue placeholder="Select method" /></SelectTrigger>
                    <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
                      <SelectItem value="flutterwave">Mobile Money / Card (Flutterwave)</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash / Pledge</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Payment reference</Label>
                <Input value={donationDraft.payment_reference} onChange={(event) => setDonationDraft((current) => ({ ...current, payment_reference: event.target.value }))} className={fieldClassName} />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Payment link</Label>
                <Input value={donationDraft.payment_link} onChange={(event) => setDonationDraft((current) => ({ ...current, payment_link: event.target.value }))} className={fieldClassName} placeholder="Hosted checkout link (optional)" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Message</Label>
                <Textarea value={donationDraft.message} onChange={(event) => setDonationDraft((current) => ({ ...current, message: event.target.value }))} className={fieldClassName} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" onClick={() => void handleSaveDonation()}>
                  {editingDonationId ? 'Save donation' : 'Record donation'}
                </Button>
                {editingDonationId ? (
                  <Button variant="outline" className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800 hover:text-white" onClick={resetDonationDraft}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredDonations.slice(0, 12).map((donation) => (
                <div key={donation.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-white">{donation.donor_name}</p>
                    <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">{donation.payment_status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">RWF {donation.amount.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-slate-500">{donation.donation_type}</p>
                  {donation.payment_method ? <p className="mt-1 text-xs text-slate-500">Method: {donation.payment_method.replace(/_/g, ' ')}</p> : null}
                  {donation.payment_provider ? <p className="mt-1 text-xs text-slate-500">Provider: {donation.payment_provider}</p> : null}
                  {donation.payment_reference ? <p className="mt-1 text-xs text-slate-500">Reference: {donation.payment_reference}</p> : null}
                  {donation.donor_email ? <p className="mt-1 text-xs text-slate-500">{donation.donor_email}</p> : null}
                  {donation.donor_phone ? <p className="mt-1 text-xs text-slate-500">{donation.donor_phone}</p> : null}
                  {donation.message ? <p className="mt-2 text-xs text-slate-400">{donation.message}</p> : null}
                  {donation.payment_link ? <p className="mt-2 text-xs text-cyan-200"><a className="underline" href={donation.payment_link} target="_blank" rel="noreferrer">Open payment link</a></p> : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800 hover:text-white" onClick={() => {
                      setEditingDonationId(donation.id)
                      setDonationDraft({
                        donor_name: donation.donor_name,
                        amount: String(donation.amount),
                        donation_type: donation.donation_type,
                        payment_status: donation.payment_status,
                        donor_email: donation.donor_email || '',
                        donor_phone: donation.donor_phone || '',
                        payment_method: donation.payment_method || '',
                        payment_provider: donation.payment_provider || '',
                        payment_reference: donation.payment_reference || '',
                        payment_link: donation.payment_link || '',
                        message: donation.message || '',
                        is_anonymous: donation.is_anonymous,
                      })
                    }}>
                      Edit
                    </Button>
                    <Button variant="outline" className="border-rose-500/40 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 hover:text-white" onClick={() => void handleDeleteDonation(donation.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : null}

      {canManageSubscribers ? (
        <Card title="Newsletter Audience" description="Update subscriber status or remove records from the live audience ledger.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {subscribers.slice(0, 12).map((subscriber) => (
              <div key={subscriber.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-white">{subscriber.email}</p>
                  <Badge className="bg-white/10 text-slate-100 hover:bg-white/10">{subscriber.status || 'subscribed'}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-300">{subscriber.source_label}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800 hover:text-white"
                    onClick={() => void handleSubscriberStatus(subscriber, subscriber.status === 'unsubscribed' ? 'subscribed' : 'unsubscribed')}
                  >
                    {subscriber.status === 'unsubscribed' ? 'Reactivate' : 'Unsubscribe'}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-rose-500/40 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 hover:text-white"
                    onClick={() => void handleDeleteSubscriber(subscriber.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  )
}
