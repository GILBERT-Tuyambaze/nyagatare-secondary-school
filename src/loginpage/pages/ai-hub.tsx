import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '../components/Card'
import { getAccessProfiles, getApplications, getBoardMembers, getClassPosts, getClassStudents, getClasses, getDonations, getEvents, getStudents } from '@/services/firestoreService'
import { analyticsInsights, chatbotMessages, controlStats, financeItems, studentTasks } from '../lib/db'
import { Application, Donation, Event, Student } from '@/types/database'
import { ClassPost, Classroom, ClassStudent, SystemUser } from '../types'

const quickPrompts = [
  'Show urgent school operations today',
  'Which academic area needs support?',
  'Summarize finance health',
  'What should admin review next?',
]

export default function AiHubPage() {
  const { accessProfile, isAdmin } = useAuth()
  const [messages, setMessages] = useState(chatbotMessages)
  const [prompt, setPrompt] = useState('')
  const [working, setWorking] = useState(false)
  const [apiError, setApiError] = useState('')
  const [previousResponseId, setPreviousResponseId] = useState<string | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [boardMembers, setBoardMembers] = useState<any[]>([])
  const [accessProfiles, setAccessProfiles] = useState<SystemUser[]>([])
  const [classes, setClasses] = useState<Classroom[]>([])
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([])
  const [classPosts, setClassPosts] = useState<ClassPost[]>([])
  const [contextStatus, setContextStatus] = useState<'loading' | 'live' | 'fallback'>('loading')
  const fieldClassName =
    'border-slate-700 bg-slate-950/80 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-slate-950'
  const outlineButtonClassName =
    'border-slate-600 bg-slate-900/80 text-slate-100 hover:border-cyan-400/40 hover:bg-slate-800 hover:text-white'

  useEffect(() => {
    let active = true

    const loadLiveContext = async () => {
      if (!isAdmin) {
        setContextStatus('fallback')
        return
      }

      try {
        const [applicationsData, eventsData, donationsData, studentsData, boardMembersData, accessProfilesData, classesData, classStudentsData, classPostsData] = await Promise.all([
          getApplications(),
          getEvents(),
          getDonations(),
          getStudents(),
          getBoardMembers(),
          getAccessProfiles(),
          getClasses(),
          getClassStudents(),
          getClassPosts(),
        ])

        if (!active) return

        setApplications(applicationsData)
        setEvents(eventsData)
        setDonations(donationsData)
        setStudents(studentsData)
        setBoardMembers(boardMembersData)
        setAccessProfiles(accessProfilesData)
        setClasses(classesData)
        setClassStudents(classStudentsData)
        setClassPosts(classPostsData)
        setContextStatus('live')
      } catch (error) {
        console.error('Failed to load live AI hub context:', error)
        if (!active) return
        setContextStatus('fallback')
      }
    }

    loadLiveContext()

    return () => {
      active = false
    }
  }, [isAdmin])

  const adminSnapshot = useMemo(
    () => ({
      openActions:
        contextStatus === 'live'
          ? String(
              applications.filter((item) => item.status === 'pending').length +
                events.filter((item) => item.status === 'upcoming').length
            )
          : controlStats.find((item) => item.label === 'Open Admin Actions')?.value ?? '0',
      enrollmentReviews:
        contextStatus === 'live'
          ? String(applications.filter((item) => item.status === 'pending' || item.status === 'review').length)
          : controlStats.find((item) => item.label === 'Enrollment Reviews')?.value ?? '0',
      financeAttention:
        contextStatus === 'live'
          ? donations.filter((item) => item.payment_status !== 'completed').length
          : financeItems.filter((item) => item.status !== 'Healthy').length,
      pendingStudentTasks:
        contextStatus === 'live'
          ? applications.filter((item) => item.status === 'pending').length
          : studentTasks.filter((item) => item.status === 'Pending').length,
      totalStudents:
        contextStatus === 'live' ? students.length : 0,
      totalDonations:
        contextStatus === 'live'
          ? donations
              .filter((item) => item.payment_status === 'completed')
              .reduce((sum, item) => sum + item.amount, 0)
          : 0,
      totalBoardMembers:
        contextStatus === 'live' ? boardMembers.length : 0,
      totalAccessProfiles:
        contextStatus === 'live' ? accessProfiles.length : 0,
      totalClasses:
        contextStatus === 'live' ? classes.length : 0,
    }),
    [accessProfiles, applications, boardMembers, classes, contextStatus, donations, events, students]
  )

  const liveContext = useMemo(
    () => ({
      source: contextStatus,
      totals: {
        applications: applications.length,
        students: students.length,
        events: events.length,
        donations: donations.length,
        boardMembers: boardMembers.length,
        accessProfiles: accessProfiles.length,
        classes: classes.length,
        classStudents: classStudents.length,
        classPosts: classPosts.length,
        completedDonationValue: donations
          .filter((item) => item.payment_status === 'completed')
          .reduce((sum, item) => sum + item.amount, 0),
      },
      applications: applications.slice(0, 10).map((item) => ({
        application_id: item.application_id,
        name: `${item.first_name} ${item.last_name}`,
        applying_grade: item.applying_grade,
        status: item.status,
        score: item.score,
        created_at: item.created_at,
      })),
      students: students.slice(0, 10).map((item) => ({
        student_id: item.student_id,
        name: `${item.first_name} ${item.last_name}`,
        status: item.status,
        email: item.email || '',
      })),
      events: events.slice(0, 10).map((item) => ({
        title: item.title,
        event_date: item.event_date,
        status: item.status,
        category: item.category,
        current_attendees: item.current_attendees,
      })),
      donations: donations.slice(0, 10).map((item) => ({
        donor_name: item.donor_name,
        amount: item.amount,
        donation_type: item.donation_type,
        payment_status: item.payment_status,
        created_at: item.created_at,
      })),
      boardMembers: boardMembers.slice(0, 10).map((item) => ({
        full_name: item.full_name,
        position: item.position,
        category: item.category,
        is_active: item.is_active,
      })),
      accessProfiles: accessProfiles.slice(0, 10).map((item) => ({
        fullName: item.fullName,
        email: item.email,
        role: item.role,
        status: item.status,
        department: item.department,
      })),
      classes: classes.slice(0, 10).map((item) => ({
        name: item.name,
        department: item.department,
        head_teacher_id: item.head_teacher_id,
        student_leader_id: item.student_leader_id || '',
      })),
      classStudents: classStudents.slice(0, 20).map((item) => ({
        class_id: item.class_id,
        student_id: item.student_id,
      })),
      classPosts: classPosts.slice(0, 20).map((item) => ({
        class_id: item.class_id,
        type: item.type,
        title: item.title,
        posted_by: item.posted_by,
        created_at: item.created_at,
      })),
    }),
    [accessProfiles, applications, boardMembers, classPosts, classStudents, classes, contextStatus, donations, events, students]
  )

  const submitPrompt = async (value: string) => {
    const trimmed = value.trim()
    if (!trimmed || !isAdmin) return

    setWorking(true)
    setApiError('')
    const userMessage = { id: `user-${Date.now()}`, speaker: 'user' as const, message: trimmed }
    setMessages((current) => [...current, userMessage])
    setPrompt('')

    try {
      const response = await fetch('/api/ai-hub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmed,
          previousResponseId,
          context: {
            role: accessProfile.role,
            adminSnapshot,
            liveContext,
            analyticsInsights,
            financeItems,
            studentTasks,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'AI hub request failed.')
      }

      setPreviousResponseId(data.id || null)
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now() + 1}`,
          speaker: 'assistant' as const,
          message: data.output_text || 'The AI assistant did not return any text.',
        },
      ])
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'The AI hub could not process your request.'
      setApiError(message)
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now() + 1}`,
          speaker: 'assistant' as const,
          message: `AI hub error: ${message}`,
        },
      ])
    } finally {
      setWorking(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    await submitPrompt(prompt)
  }

  return (
    <div className="space-y-6">
      <Card title="AI Chatbot + Analytics Hub" description="A working admin-focused assistant for operational summaries and quick analytics guidance.">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
                    message.speaker === 'assistant'
                      ? 'bg-cyan-500/10 text-cyan-100'
                      : 'ml-auto bg-white/10 text-slate-100'
                  }`}
                >
                  {message.message}
                </div>
              ))}
              {working ? (
                <div className="max-w-[90%] rounded-2xl bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
                  AI assistant is analyzing your request...
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((item) => (
                <Button
                  key={item}
                  type="button"
                  variant="outline"
                  className={outlineButtonClassName}
                  onClick={() => submitPrompt(item)}
                  disabled={!isAdmin || working}
                >
                  {item}
                </Button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={isAdmin ? 'Ask the AI hub about academics, finance, students, or admin operations...' : 'Admin access is required to use the AI assistant'}
                className={fieldClassName}
                disabled={!isAdmin || working}
              />
              <Button type="submit" className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" disabled={!isAdmin || working}>
                Send
              </Button>
            </form>

            {apiError ? <p className="text-sm text-amber-300">{apiError}</p> : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-white">Access Mode</p>
                <Badge className="bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10">
                  {isAdmin ? 'Admin Active' : accessProfile.role}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                {isAdmin
                  ? 'You can use the AI assistant to ask operational questions and get admin-focused summaries.'
                  : 'You can view insights, but only admin accounts can send AI assistant prompts.'}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Data source: {contextStatus === 'live' ? 'Live Firestore collections' : contextStatus === 'loading' ? 'Loading Firestore context...' : 'Fallback sample context'}
              </p>
            </div>

            {isAdmin ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="font-semibold text-emerald-200">Admin Console Snapshot</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-emerald-100/80">Open Admin Actions</p>
                    <p className="mt-1 text-2xl font-bold text-white">{adminSnapshot.openActions}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-emerald-100/80">Enrollment Reviews</p>
                    <p className="mt-1 text-2xl font-bold text-white">{adminSnapshot.enrollmentReviews}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {analyticsInsights.map((insight) => (
              <div key={insight.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">{insight.title}</p>
                  <Badge className="bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10">{insight.confidence}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-300">{insight.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
