import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BookOpen, CalendarDays, CheckCircle2, ClipboardList, DollarSign, GraduationCap, LayoutDashboard, Mail, MessageSquare, Shield, UserCog, UserPlus, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getAccessProfiles, getActivityLogs, getApplications, getClasses, getClassStudents, getClassTeacherAssignments, getContentPosts, getDonations, getEvents, getInvites, getLearningResources, getStudentMarks, getStudents } from '@/services/firestoreService'
import { ActivityLog, Application, ClassTeacherAssignment, ContentPost, Donation, Event, LearningResource, Student, StudentMark } from '@/types/database'
import { Card } from '../components/Card'
import { SuperAdminAlerts } from '../components/SuperAdminAlerts'
import { SuperAdminFutureModules } from '../components/SuperAdminFutureModules'
import { SuperAdminQuickActions } from '../components/SuperAdminQuickActions'
import { SuperAdminRecentActivity } from '../components/SuperAdminRecentActivity'
import { SuperAdminStatsGrid } from '../components/SuperAdminStatsGrid'
import { RoleWorkspaceActions } from '../components/RoleWorkspaceActions'
import { RoleWorkspaceList } from '../components/RoleWorkspaceList'
import { RoleWorkspaceStats } from '../components/RoleWorkspaceStats'
import { roleDefinitions } from '../lib/rbac'
import { getAccessibleSystemNav } from '../lib/systemNavigation'
import { Classroom, Invite, SystemUser } from '../types'

export default function SystemIndexPage() {
  const { accessProfile } = useAuth()
  const accessibleModules = getAccessibleSystemNav(accessProfile).filter((item) => item.to !== '/system')
  const isSuperAdmin = accessProfile.role === 'SuperAdmin'
  const isHeadmaster = accessProfile.role === 'Headmaster'
  const isDos = accessProfile.role === 'DOS'
  const isHod = accessProfile.role === 'HOD'
  const isTeacher = accessProfile.role === 'Teacher'
  const isStudent = accessProfile.role === 'Student'
  const needsRoleAwareOverview = isSuperAdmin || isHeadmaster || isDos || isHod || isTeacher || isStudent

  const [users, setUsers] = useState<SystemUser[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [classes, setClasses] = useState<Classroom[]>([])
  const [contentPosts, setContentPosts] = useState<ContentPost[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classStudents, setClassStudents] = useState<Array<{ id: string; class_id: string; student_id: string }>>([])
  const [assignments, setAssignments] = useState<ClassTeacherAssignment[]>([])
  const [resources, setResources] = useState<LearningResource[]>([])
  const [marks, setMarks] = useState<StudentMark[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])

  useEffect(() => {
    if (!needsRoleAwareOverview) return

    const loadOverview = async () => {
      try {
        const [userData, applicationData, eventData, donationData, classData, contentData, inviteData, studentData, classStudentData, assignmentData, resourceData, markData, activityData] = await Promise.all([
          getAccessProfiles(),
          getApplications(),
          getEvents(),
          getDonations(),
          getClasses(),
          getContentPosts(),
          getInvites(),
          getStudents(),
          getClassStudents(),
          getClassTeacherAssignments(),
          getLearningResources(),
          getStudentMarks(),
          getActivityLogs(),
        ])

        setUsers(userData)
        setApplications(applicationData)
        setEvents(eventData)
        setDonations(donationData)
        setClasses(classData)
        setContentPosts(contentData)
        setInvites(inviteData)
        setStudents(studentData)
        setClassStudents(classStudentData)
        setAssignments(assignmentData)
        setResources(resourceData)
        setMarks(markData)
        setActivityLogs(activityData)
      } catch (error) {
        console.error('Failed to load role-aware overview:', error)
      }
    }

    loadOverview()
  }, [needsRoleAwareOverview])

  const superAdminStats = useMemo(() => {
    const totalStudents = users.filter((user) => user.role === 'Student').length
    const totalTeachers = users.filter((user) => user.role === 'Teacher').length
    const totalParents = users.filter((user) => user.role === 'Parent').length
    const totalUsers = users.length
    const revenueCollected = donations
      .filter((donation) => donation.payment_status === 'completed')
      .reduce((sum, donation) => sum + donation.amount, 0)
    const activeClasses = classes.length
    const pendingAdmissions = applications.filter((application) => application.status === 'pending' || application.status === 'review').length
    const publishQueue = contentPosts.filter((post) => post.status !== 'published').length

    return [
      {
        label: 'Total Students',
        value: totalStudents,
        tone: 'good',
        to: '/system/users',
        detail: 'Learners currently modeled in access and student records.',
        icon: GraduationCap,
      },
      {
        label: 'Total Teachers',
        value: totalTeachers,
        tone: 'good',
        to: '/system/users',
        detail: 'Teaching staff with active system access.',
        icon: Users,
      },
      {
        label: 'Parents and Guardians',
        value: totalParents,
        tone: 'neutral',
        to: '/system/users',
        detail: 'Parent roles currently registered in the system.',
        icon: Users,
      },
      {
        label: 'Total Users',
        value: totalUsers,
        tone: 'neutral',
        to: '/system/users',
        detail: 'All registered access profiles in the system.',
        icon: LayoutDashboard,
      },
      {
        label: 'Recorded Revenue',
        value: `RWF ${revenueCollected.toLocaleString()}`,
        tone: revenueCollected > 0 ? 'good' : 'warn',
        to: '/system/finance',
        detail: 'Current income data from completed finance records.',
        icon: DollarSign,
      },
      {
        label: 'Active Classes',
        value: activeClasses,
        tone: 'neutral',
        to: '/system/academics',
        detail: 'Classes currently running in the academic module.',
        icon: BookOpen,
      },
      {
        label: 'Admissions Queue',
        value: pendingAdmissions,
        tone: pendingAdmissions > 0 ? 'warn' : 'good',
        to: '/system/applications',
        detail: 'Applications waiting for review or final decision.',
        icon: AlertTriangle,
      },
      {
        label: 'Content Review Queue',
        value: publishQueue,
        tone: publishQueue > 0 ? 'warn' : 'good',
        to: '/system/content',
        detail: 'News, blog, or announcement items not yet published.',
        icon: Mail,
      },
    ] as const
  }, [applications, classes, contentPosts, donations, users])

  const recentActivity = useMemo(() => {
    const applicationItems = applications.slice(0, 4).map((application) => ({
      id: `application-${application.id}`,
      label: `Application submitted`,
      note: `${application.first_name} ${application.last_name} for ${application.applying_grade}`,
      at: application.created_at,
      to: '/system/applications',
    }))

    const inviteItems = invites.slice(0, 4).map((invite) => ({
      id: `invite-${invite.id}`,
      label: `Invitation ${invite.status}`,
      note: `${invite.email} invited as ${invite.role}`,
      at: invite.createdAt || invite.expiresAt,
      to: '/system/invite',
    }))

    const contentItems = contentPosts.slice(0, 4).map((post) => ({
      id: `content-${post.id}`,
      label: `Content ${post.status}`,
      note: `${post.title} in ${post.type}`,
      at: post.updated_at,
      to: '/system/content',
    }))

    const eventItems = events.slice(0, 3).map((event) => ({
      id: `event-${event.id}`,
      label: `Event updated`,
      note: `${event.title} scheduled for ${new Date(event.event_date).toLocaleDateString()}`,
      at: event.updated_at,
      to: '/system/content',
    }))

    return [...applicationItems, ...inviteItems, ...contentItems, ...eventItems]
      .sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime())
      .slice(0, 10)
  }, [applications, contentPosts, events, invites])

  const alerts = useMemo(() => {
    const pendingAdmissions = applications.filter((application) => application.status === 'pending' || application.status === 'review').length
    const upcomingEvents = events.filter((event) => event.status === 'upcoming').length
    const pendingInvites = invites.filter((invite) => invite.status === 'pending').length
    const reviewContent = contentPosts.filter((post) => post.status === 'review').length

    return [
      pendingAdmissions > 0
        ? { id: 'admissions', text: `${pendingAdmissions} admissions still need review or final decision.`, to: '/system/applications' }
        : null,
      reviewContent > 0
        ? { id: 'content', text: `${reviewContent} content items are waiting in review before publishing.`, to: '/system/content' }
        : null,
      pendingInvites > 0
        ? { id: 'invites', text: `${pendingInvites} invitation links are still pending acceptance.`, to: '/system/invite' }
        : null,
      upcomingEvents > 0
        ? { id: 'events', text: `${upcomingEvents} upcoming events are already on the calendar.`, to: '/system/content' }
        : null,
    ].filter(Boolean) as Array<{ id: string; text: string; to: string }>
  }, [applications, contentPosts, events, invites])

  const quickActions = [
    { label: 'Add User', to: '/system/users', icon: UserPlus, detail: 'Create or manage staff, parent, and learner accounts.' },
    { label: 'Assign Roles', to: '/system/roles', icon: LayoutDashboard, detail: 'Update role coverage and access mapping.' },
    { label: 'Review Admissions', to: '/system/applications', icon: AlertTriangle, detail: 'Handle applicant decisions and notes.' },
    { label: 'Publish News', to: '/system/content', icon: Mail, detail: 'Create or publish news, blog, and announcement content.' },
    { label: 'Open Finance', to: '/system/finance', icon: DollarSign, detail: 'Review recorded income and finance health.' },
    { label: 'Open Academics', to: '/system/academics', icon: BookOpen, detail: 'Track classroom and learning-side activity.' },
  ]

  const academicLeads = users.filter((user) => ['Headmaster', 'DOS', 'HOD', 'Teacher'].includes(user.role))
  const pendingApplications = applications.filter((application) => application.status === 'pending' || application.status === 'review')
  const admittedApplications = applications.filter((application) => application.status === 'admitted')
  const publishQueue = contentPosts.filter((post) => post.status !== 'published')
  const reviewQueue = contentPosts.filter((post) => post.status === 'review')
  const upcomingEvents = events.filter((event) => event.status === 'upcoming')
  const totalRevenue = donations
    .filter((donation) => donation.payment_status === 'completed')
    .reduce((sum, donation) => sum + donation.amount, 0)
  const currentProfileUser = users.find((item) => item.email?.toLowerCase() === accessProfile.email?.toLowerCase())
  const teacherAssignments = assignments.filter(
    (assignment) =>
      assignment.teacher_user_id === currentProfileUser?.id ||
      assignment.teacher_name.toLowerCase() === accessProfile.displayName.toLowerCase()
  )
  const teacherClassIds = Array.from(new Set(teacherAssignments.map((assignment) => assignment.class_id)))
  const teacherClasses = classes.filter((classroom) => teacherClassIds.includes(classroom.id))
  const teacherSubjectIds = Array.from(new Set(teacherAssignments.map((assignment) => assignment.subject_id)))
  const teacherResources = resources.filter((resource) => teacherSubjectIds.includes(resource.subject_id || '') || teacherClassIds.includes(resource.class_id))
  const teacherMarks = marks.filter(
    (mark) => teacherSubjectIds.includes(mark.subject_id) || teacherClassIds.includes(mark.class_id)
  )
  const teacherActivity = activityLogs.filter(
    (item) => item.actor_uid === currentProfileUser?.id || item.actor_name.toLowerCase() === accessProfile.displayName.toLowerCase()
  )
  const currentStudent = students.find((student) => student.email?.toLowerCase() === accessProfile.email?.toLowerCase())
  const studentMembership = classStudents.find((membership) => membership.student_id === currentStudent?.id)
  const studentClass = classes.find((classroom) => classroom.id === studentMembership?.class_id)
  const studentResources = resources.filter((resource) => resource.class_id === studentClass?.id)
  const studentMarks = marks.filter((mark) => mark.student_id === currentStudent?.id)
  const studentAverage =
    studentMarks.length > 0
      ? Math.round(studentMarks.reduce((sum, mark) => sum + (mark.score / Math.max(mark.max_score, 1)) * 100, 0) / studentMarks.length)
      : 0
  const studentPendingResources = studentResources.filter((resource) => resource.due_date).length

  const headmasterStats = [
    {
      label: 'Whole-School Users',
      value: users.length,
      note: 'Leadership-visible accounts across staff, parents, and learners.',
      icon: Users,
    },
    {
      label: 'Admissions Decisions Pending',
      value: pendingApplications.length,
      note: 'Applications still waiting for leadership review or final sign-off.',
      icon: ClipboardList,
    },
    {
      label: 'Academic Classes Live',
      value: classes.length,
      note: 'Classes currently active in the academic workspace.',
      icon: GraduationCap,
    },
    {
      label: 'Finance Snapshot',
      value: `RWF ${totalRevenue.toLocaleString()}`,
      note: 'Completed revenue records visible to executive leadership.',
      icon: DollarSign,
    },
  ]

  const dosStats = [
    {
      label: 'Teaching Team',
      value: users.filter((user) => user.role === 'Teacher' || user.role === 'HOD').length,
      note: 'Teachers and department leads currently modeled in the system.',
      icon: Users,
    },
    {
      label: 'Classes to Coordinate',
      value: classes.length,
      note: 'All active class spaces under academic oversight.',
      icon: BookOpen,
    },
    {
      label: 'Admissions in Academic Review',
      value: pendingApplications.length,
      note: 'Applicants who may need academic placement or subject-fit review.',
      icon: ClipboardList,
    },
    {
      label: 'Learning Content Queue',
      value: publishQueue.length,
      note: 'Materials, news, or updates still waiting before publication.',
      icon: Mail,
    },
  ]

  const hodStats = [
    {
      label: 'Department Teachers',
      value: users.filter((user) => user.role === 'Teacher').length,
      note: 'Teachers available for departmental coordination and support.',
      icon: Users,
    },
    {
      label: 'Marks and Class Access',
      value: classes.length,
      note: 'Class spaces available for department-facing oversight.',
      icon: GraduationCap,
    },
    {
      label: 'Academic Review Queue',
      value: pendingApplications.length,
      note: 'Applicants and learners needing department-level attention.',
      icon: ClipboardList,
    },
    {
      label: 'Upcoming Academic Events',
      value: upcomingEvents.length,
      note: 'Calendar items that may affect departmental planning.',
      icon: CalendarDays,
    },
  ]

  const headmasterActions = [
    { label: 'Open Executive Control Center', to: '/system/control-center', detail: 'Review whole-school operations, leadership figures, and strategic signals.', icon: LayoutDashboard },
    { label: 'Review Admissions Decisions', to: '/system/applications', detail: 'Move applicants toward admitted, rejected, or waitlist outcomes.', icon: ClipboardList },
    { label: 'Inspect Users and Access', to: '/system/users', detail: 'See detailed accounts, update non-protected users, and follow access status.', icon: UserCog },
    { label: 'Open Class Operations', to: '/system/class-operations', detail: 'Check class creation, teacher placement, and learner movement oversight.', icon: BookOpen },
  ]

  const dosActions = [
    { label: 'Open Academic Command Center', to: '/system/academics', detail: 'Lead classes, learning resources, marks, and subject-level delivery.', icon: GraduationCap },
    { label: 'Coordinate Class Operations', to: '/system/class-operations', detail: 'Assign teachers, align class teacher roles, and place learners properly.', icon: BookOpen },
    { label: 'Review Academic Admissions', to: '/system/applications', detail: 'Follow applicant readiness and academic placement needs.', icon: ClipboardList },
    { label: 'Use AI Academic Support', to: '/system/ai-hub', detail: 'Ask for insight on learning pressure, content backlog, and academic patterns.', icon: LayoutDashboard },
  ]

  const hodActions = [
    { label: 'Open Department Workspace', to: '/system/academics', detail: 'Track marks, class teaching, and learning materials with department focus.', icon: GraduationCap },
    { label: 'Support Teacher Assignment', to: '/system/class-operations', detail: 'Help coordinate subject-teacher placement inside the class system.', icon: BookOpen },
    { label: 'Review Department Access', to: '/system/users', detail: 'Inspect teacher and learner access records relevant to your leadership layer.', icon: UserCog },
    { label: 'Check Discipline and Support', to: '/system/discipline', detail: 'Review wellbeing and discipline context affecting academic delivery.', icon: Shield },
  ]

  const headmasterLists = [
    {
      title: 'Executive Watchlist',
      description: 'High-priority items requiring executive attention today.',
      emptyMessage: 'No executive watchlist items are active right now.',
      items: [
        ...pendingApplications.slice(0, 4).map((application) => ({
          id: `headmaster-app-${application.id}`,
          title: `${application.first_name} ${application.last_name}`,
          detail: `Application for ${application.applying_grade} is waiting for review or final leadership decision.`,
          to: '/system/applications',
          badge: application.status,
        })),
        ...reviewQueue.slice(0, 3).map((post) => ({
          id: `headmaster-content-${post.id}`,
          title: post.title,
          detail: `${post.type} content is still waiting in review before publication.`,
          to: '/system/content',
          badge: post.status,
        })),
      ].slice(0, 6),
    },
    {
      title: 'Leadership Team View',
      description: 'Academic and operational leaders currently visible in the system.',
      emptyMessage: 'No leadership team records are available yet.',
      items: academicLeads.slice(0, 6).map((user) => ({
        id: `lead-${user.id}`,
        title: user.fullName,
        detail: `${user.role} in ${user.department}.`,
        to: '/system/users',
        badge: user.status,
      })),
    },
  ]

  const dosLists = [
    {
      title: 'Academic Readiness Queue',
      description: 'Learner and class issues the Director of Studies may want to address next.',
      emptyMessage: 'Academic readiness items will appear here as class and admissions data grows.',
      items: [
        ...pendingApplications.slice(0, 4).map((application) => ({
          id: `dos-app-${application.id}`,
          title: `${application.first_name} ${application.last_name}`,
          detail: `Pending academic review for ${application.applying_grade}.`,
          to: '/system/applications',
          badge: application.status,
        })),
        ...classes.slice(0, 4).map((classroom) => ({
          id: `dos-class-${classroom.id}`,
          title: classroom.name,
          detail: `${classroom.department} class space is active in the learning system.`,
          to: '/system/class-operations',
          badge: 'class',
        })),
      ].slice(0, 6),
    },
    {
      title: 'Teaching and Learning Pulse',
      description: 'Signals tied to subjects, content, and academic publishing.',
      emptyMessage: 'Academic communication items will appear here once more class activity is logged.',
      items: publishQueue.slice(0, 6).map((post) => ({
        id: `dos-post-${post.id}`,
        title: post.title,
        detail: `${post.type} content is currently ${post.status} and may need academic alignment.`,
        to: '/system/content',
        badge: post.status,
      })),
    },
  ]

  const hodLists = [
    {
      title: 'Department Admin Queue',
      description: 'Items an HOD can track for departmental support and academic stability.',
      emptyMessage: 'Departmental review items will appear here as more records are added.',
      items: [
        ...pendingApplications.slice(0, 3).map((application) => ({
          id: `hod-app-${application.id}`,
          title: `${application.first_name} ${application.last_name}`,
          detail: `Academic intake review still pending for ${application.applying_grade}.`,
          to: '/system/applications',
          badge: application.status,
        })),
        ...upcomingEvents.slice(0, 3).map((event) => ({
          id: `hod-event-${event.id}`,
          title: event.title,
          detail: `Upcoming ${event.category} event on ${new Date(event.event_date).toLocaleDateString()}.`,
          to: '/system/content',
          badge: event.status,
        })),
      ].slice(0, 6),
    },
    {
      title: 'Department Publishing and Reports',
      description: 'Content and communication items relevant to departmental coordination.',
      emptyMessage: 'No department-facing publishing items are waiting right now.',
      items: contentPosts.slice(0, 6).map((post) => ({
        id: `hod-post-${post.id}`,
        title: post.title,
        detail: `${post.type} item currently marked ${post.status}.`,
        to: '/system/content',
        badge: post.status,
      })),
    },
  ]

  const teacherStats = [
    {
      label: 'Assigned Classes',
      value: teacherClasses.length,
      note: 'Only the classes currently deployed to this teacher.',
      icon: GraduationCap,
    },
    {
      label: 'Subject Coverage',
      value: teacherSubjectIds.length,
      note: 'Subjects this teacher is actively handling in the class system.',
      icon: BookOpen,
    },
    {
      label: 'Learning Resources',
      value: teacherResources.length,
      note: 'Assignments, notes, materials, and holiday packages already attached to this teaching scope.',
      icon: ClipboardList,
    },
    {
      label: 'Recent Teaching Activity',
      value: teacherActivity.length,
      note: 'Logged actions tied to marks, messages, and classroom delivery.',
      icon: MessageSquare,
    },
  ]

  const teacherActions = [
    { label: 'Open Teaching Workspace', to: '/system/academics', detail: 'Go straight to assigned classes, learning resources, marks, and chats.', icon: GraduationCap },
    { label: 'Review Class Operations', to: '/system/class-operations', detail: 'See how class assignments and learner placement are being managed.', icon: BookOpen },
    { label: 'Check Student Dashboard View', to: '/system/student-dashboard', detail: 'Understand the learner-facing view that students are working with.', icon: LayoutDashboard },
    { label: 'Use AI Support', to: '/system/ai-hub', detail: 'Get quick academic insight and operational support while teaching.', icon: MessageSquare },
  ]

  const teacherLists = [
    {
      title: 'Teaching Load',
      description: 'Your current class-subject deployment in the system.',
      emptyMessage: 'No class assignments are attached to this teacher yet.',
      items: teacherAssignments.slice(0, 6).map((assignment) => ({
        id: `teacher-assignment-${assignment.id}`,
        title: `${assignment.subject_name} - ${classes.find((classroom) => classroom.id === assignment.class_id)?.name || 'Class'}`,
        detail: `${assignment.term} ${assignment.academic_year} with ${assignment.teacher_name}.`,
        to: '/system/academics',
        badge: assignment.can_change_class ? 'change enabled' : 'active',
      })),
    },
    {
      title: 'Marks and Resource Signals',
      description: 'Quick teaching-side indicators you may want to act on next.',
      emptyMessage: 'No marks or resources have been recorded for this teaching scope yet.',
      items: [
        ...teacherResources.slice(0, 3).map((resource) => ({
          id: `teacher-resource-${resource.id}`,
          title: resource.title,
          detail: `${resource.type.replace('_', ' ')} for ${classes.find((classroom) => classroom.id === resource.class_id)?.name || 'assigned class'}.`,
          to: '/system/academics',
          badge: resource.due_date ? 'due' : 'resource',
        })),
        ...teacherMarks.slice(0, 3).map((mark) => ({
          id: `teacher-mark-${mark.id}`,
          title: `${mark.student_name} - ${mark.subject_name}`,
          detail: `Current score ${mark.score}/${mark.max_score} in ${mark.term}.`,
          to: '/system/academics',
          badge: 'mark',
        })),
      ].slice(0, 6),
    },
  ]

  const studentStats = [
    {
      label: 'Current Class',
      value: studentClass?.name || 'Not linked',
      note: 'The live class space currently matched to this student account.',
      icon: GraduationCap,
    },
    {
      label: 'Average Mark',
      value: `${studentAverage}%`,
      note: 'A running average from the subject marks already available.',
      icon: CheckCircle2,
    },
    {
      label: 'Resource Queue',
      value: studentPendingResources,
      note: 'Assignments and learning packages that currently carry due dates.',
      icon: ClipboardList,
    },
    {
      label: 'Subject Marks',
      value: studentMarks.length,
      note: 'Marks the learner can already review and respond to.',
      icon: BookOpen,
    },
  ]

  const studentActions = [
    { label: 'Open Learner Workspace', to: '/system/student-dashboard', detail: 'See your class, marks, teacher comments, and subject messaging tools.', icon: GraduationCap },
    { label: 'Open Class Resources', to: '/system/academics', detail: 'Jump into the wider class system from the learner side.', icon: BookOpen },
    { label: 'Review Applicant Portal', to: '/applicant-portal', detail: 'Check the public-facing academic and admissions follow-up area.', icon: LayoutDashboard },
    { label: 'Ask the AI Hub', to: '/system/ai-hub', detail: 'Use guided school support where your role can access it.', icon: MessageSquare },
  ]

  const studentLists = [
    {
      title: 'Learning Queue',
      description: 'The next learning items that matter most in the current class.',
      emptyMessage: 'No learner resources are available for this class yet.',
      items: studentResources.slice(0, 6).map((resource) => ({
        id: `student-resource-${resource.id}`,
        title: resource.title,
        detail: `${resource.type.replace('_', ' ')}${resource.due_date ? ` due ${resource.due_date}` : ''}.`,
        to: '/system/student-dashboard',
        badge: resource.due_date ? 'due' : 'resource',
      })),
    },
    {
      title: 'Subject Mark Summary',
      description: 'A lighter, learner-friendly preview of current mark visibility.',
      emptyMessage: 'Marks will appear here once teachers publish them.',
      items: studentMarks.slice(0, 6).map((mark) => ({
        id: `student-mark-${mark.id}`,
        title: mark.subject_name,
        detail: `${mark.score}/${mark.max_score} from ${mark.teacher_name}.`,
        to: '/system/student-dashboard',
        badge: `${Math.round((mark.score / Math.max(mark.max_score, 1)) * 100)}%`,
      })),
    },
  ]

  return (
    <div className="space-y-6">
      {isSuperAdmin ? (
        <>
          <section className="space-y-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-200">Executive Overview</p>
                <h2 className="mt-2 text-2xl font-bold text-white">SuperAdmin Control Surface</h2>
                <p className="mt-1 max-w-3xl text-sm text-slate-300">
                  A tighter live overview of users, admissions, finance, content, and class operations without the old overcrowded layout.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/system/users" className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:border-cyan-400/30 hover:text-white">
                  Open Users
                </Link>
                <Link to="/system/class-operations" className="rounded-2xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition-colors hover:border-cyan-400/40">
                  Open Class Operations
                </Link>
              </div>
            </div>
            <SuperAdminStatsGrid items={superAdminStats as any} />
          </section>

          <div className="grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
            <Card title="Leadership Snapshot" description="Short-form summaries that stay readable and reduce scroll pressure on the main dashboard.">
              <div className="grid gap-4 xl:grid-cols-3">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-400">Upcoming Events</p>
                      <p className="mt-2 text-3xl font-bold text-white">{events.filter((event) => event.status === 'upcoming').length}</p>
                    </div>
                    <CalendarDays className="h-5 w-5 text-cyan-200" />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">Calendar items that leadership may need to promote, support, or supervise.</p>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
                  <p className="text-sm text-slate-400">Admissions Outcome Mix</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-200">
                    <div className="flex items-center justify-between gap-3"><span>Admitted</span><span className="font-semibold">{applications.filter((application) => application.status === 'admitted').length}</span></div>
                    <div className="flex items-center justify-between gap-3"><span>Rejected</span><span className="font-semibold">{applications.filter((application) => application.status === 'rejected').length}</span></div>
                    <div className="flex items-center justify-between gap-3"><span>Waitlist</span><span className="font-semibold">{applications.filter((application) => application.status === 'waitlist').length}</span></div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
                  <p className="text-sm text-slate-400">Content Publishing Mix</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge className="bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10">
                      {contentPosts.filter((post) => post.type === 'news').length} news
                    </Badge>
                    <Badge className="bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10">
                      {contentPosts.filter((post) => post.type === 'blog').length} blog
                    </Badge>
                    <Badge className="bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10">
                      {contentPosts.filter((post) => post.type === 'announcement').length} announcements
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">A quick publishing balance across the public-facing communication channels.</p>
                </div>
              </div>
            </Card>

            <SuperAdminAlerts alerts={alerts} />
          </div>

          <div className="grid gap-6 2xl:grid-cols-[0.95fr_1.05fr]">
            <SuperAdminQuickActions actions={quickActions} />
            <SuperAdminRecentActivity items={recentActivity} />
          </div>

          <SuperAdminFutureModules />
        </>
      ) : isHeadmaster ? (
        <div className="space-y-6">
          <Card title="Headmaster Executive Overview" description="A whole-school landing page for executive oversight, decisions, and leadership coordination.">
            <div className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Executive Role</p>
                <h2 className="mt-3 text-3xl font-bold text-white">Headmaster Control Desk</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Whole-school visibility across admissions, users, classes, content, finance, and leadership execution.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
                  <p className="text-sm text-slate-400">Admitted Applicants</p>
                  <p className="mt-2 text-3xl font-bold text-cyan-100">{admittedApplications.length}</p>
                  <p className="mt-2 text-sm text-slate-300">Applicants already moved into admitted status.</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
                  <p className="text-sm text-slate-400">Pending Invites</p>
                  <p className="mt-2 text-3xl font-bold text-cyan-100">{invites.filter((invite) => invite.status === 'pending').length}</p>
                  <p className="mt-2 text-sm text-slate-300">Role onboarding links still awaiting acceptance.</p>
                </div>
              </div>
            </div>
          </Card>

          <RoleWorkspaceStats
            title="Executive Stats"
            description="The figures that matter most for headmaster-level oversight."
            items={headmasterStats}
          />

          <div className="grid gap-6 2xl:grid-cols-[0.95fr,1.05fr]">
            <RoleWorkspaceActions
              title="Executive Actions"
              description="Fast entry into the core leadership workflows."
              actions={headmasterActions}
            />
            <RoleWorkspaceList {...headmasterLists[0]} />
          </div>

          <RoleWorkspaceList {...headmasterLists[1]} />
        </div>
      ) : isDos ? (
        <div className="space-y-6">
          <Card title="DOS Academic Command Center" description="A Director of Studies landing page centered on classes, teachers, learning resources, and academic decision flow.">
            <div className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Academic Leadership</p>
                <h2 className="mt-3 text-3xl font-bold text-white">Director of Studies Desk</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Focus on teacher deployment, subject delivery, class execution, and academic readiness across the school.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
                  <p className="text-sm text-slate-400">Published Content</p>
                  <p className="mt-2 text-3xl font-bold text-cyan-100">{contentPosts.filter((post) => post.status === 'published').length}</p>
                  <p className="mt-2 text-sm text-slate-300">Learning-facing news and updates already live.</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
                  <p className="text-sm text-slate-400">Upcoming Academic Events</p>
                  <p className="mt-2 text-3xl font-bold text-cyan-100">{upcomingEvents.length}</p>
                  <p className="mt-2 text-sm text-slate-300">Calendar items likely to affect teaching and learning flow.</p>
                </div>
              </div>
            </div>
          </Card>

          <RoleWorkspaceStats
            title="Academic Command Metrics"
            description="A tighter operational snapshot for the DOS role."
            items={dosStats}
          />

          <div className="grid gap-6 2xl:grid-cols-[0.95fr,1.05fr]">
            <RoleWorkspaceActions
              title="DOS Actions"
              description="Fast routes into the class system and academic workflow."
              actions={dosActions}
            />
            <RoleWorkspaceList {...dosLists[0]} />
          </div>

          <RoleWorkspaceList {...dosLists[1]} />
        </div>
      ) : isHod ? (
        <div className="space-y-6">
          <Card title="HOD Department Workspace" description="A focused admin workspace for departmental leadership, teacher support, and academic follow-up.">
            <div className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Department Leadership</p>
                <h2 className="mt-3 text-3xl font-bold text-white">Head of Department Workspace</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Support teachers, monitor learning delivery, and keep departmental operations organized without the noise of full executive admin space.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
                  <p className="text-sm text-slate-400">Review Content</p>
                  <p className="mt-2 text-3xl font-bold text-cyan-100">{reviewQueue.length}</p>
                  <p className="mt-2 text-sm text-slate-300">Items still in review that may need departmental attention.</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
                  <p className="text-sm text-slate-400">Leadership Modules</p>
                  <p className="mt-2 text-3xl font-bold text-cyan-100">{accessibleModules.length}</p>
                  <p className="mt-2 text-sm text-slate-300">Role-aware tools currently available to this HOD session.</p>
                </div>
              </div>
            </div>
          </Card>

          <RoleWorkspaceStats
            title="Department Snapshot"
            description="The admin and academic indicators most relevant to HOD work."
            items={hodStats}
          />

          <div className="grid gap-6 2xl:grid-cols-[0.95fr,1.05fr]">
            <RoleWorkspaceActions
              title="HOD Actions"
              description="Department-first routes into academic and admin work."
              actions={hodActions}
            />
            <RoleWorkspaceList {...hodLists[0]} />
          </div>

          <RoleWorkspaceList {...hodLists[1]} />
        </div>
      ) : isTeacher ? (
        <div className="space-y-6">
          <Card title="Teacher Teaching Home" description="A cleaner teaching launchpad centered on assigned classes, learning delivery, and learner follow-up.">
            <div className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Teaching Role</p>
                <h2 className="mt-3 text-3xl font-bold text-white">Teacher Workspace</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Focus on your assigned classes, active subjects, marks, and the student support flow that sits around them.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
                  <p className="text-sm text-slate-400">Assigned Subjects</p>
                  <p className="mt-2 text-3xl font-bold text-cyan-100">{teacherSubjectIds.length}</p>
                  <p className="mt-2 text-sm text-slate-300">Subjects this teacher can actively deliver and report on.</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
                  <p className="text-sm text-slate-400">Learner Marks Visible</p>
                  <p className="mt-2 text-3xl font-bold text-cyan-100">{teacherMarks.length}</p>
                  <p className="mt-2 text-sm text-slate-300">Subject marks currently attached to this teaching scope.</p>
                </div>
              </div>
            </div>
          </Card>

          <RoleWorkspaceStats
            title="Teaching Snapshot"
            description="The main teaching indicators for this session."
            items={teacherStats}
          />

          <div className="grid gap-6 2xl:grid-cols-[0.95fr,1.05fr]">
            <RoleWorkspaceActions
              title="Teacher Actions"
              description="Fast routes into the teaching work you do most."
              actions={teacherActions}
            />
            <RoleWorkspaceList {...teacherLists[0]} />
          </div>

          <RoleWorkspaceList {...teacherLists[1]} />
        </div>
      ) : isStudent ? (
        <div className="space-y-6">
          <Card title="Student Learning Home" description="A learner-first landing page for class access, subject progress, and academic follow-up.">
            <div className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Learner View</p>
                <h2 className="mt-3 text-3xl font-bold text-white">Student Workspace</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Stay focused on your class, the next learning tasks, teacher comments, and the marks that are already available.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
                  <p className="text-sm text-slate-400">Current Class</p>
                  <p className="mt-2 text-2xl font-bold text-cyan-100">{studentClass?.name || 'Not linked yet'}</p>
                  <p className="mt-2 text-sm text-slate-300">Your live class assignment in the system.</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
                  <p className="text-sm text-slate-400">Marks Available</p>
                  <p className="mt-2 text-3xl font-bold text-cyan-100">{studentMarks.length}</p>
                  <p className="mt-2 text-sm text-slate-300">Subjects already showing marks and teacher comments.</p>
                </div>
              </div>
            </div>
          </Card>

          <RoleWorkspaceStats
            title="Learning Snapshot"
            description="A lighter, learner-friendly view of what matters now."
            items={studentStats}
          />

          <div className="grid gap-6 2xl:grid-cols-[0.95fr,1.05fr]">
            <RoleWorkspaceActions
              title="Student Actions"
              description="Direct routes into your class, marks, and support tools."
              actions={studentActions}
            />
            <RoleWorkspaceList {...studentLists[0]} />
          </div>

          <RoleWorkspaceList {...studentLists[1]} />
        </div>
      ) : (
        <div className="space-y-6">
          <Card title="Your Workspace" description="A cleaner role summary with direct focus on what this session can do right now.">
            <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Current Role</p>
                <p className="mt-3 text-3xl font-bold text-white">{accessProfile.role}</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Signed in as {accessProfile.displayName}. This dashboard now highlights the modules and permissions that matter to your current role.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
                  <p className="text-sm text-slate-400">Permission Count</p>
                  <p className="mt-2 text-3xl font-bold text-cyan-100">{accessProfile.permissions.length}</p>
                  <p className="mt-2 text-sm text-slate-300">Live permissions attached to this session.</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
                  <p className="text-sm text-slate-400">Platform Roles</p>
                  <p className="mt-2 text-3xl font-bold text-cyan-100">{roleDefinitions.length}</p>
                  <p className="mt-2 text-sm text-slate-300">Predefined roles available across the school system.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card title="Your Permission Map" description="Everything the current role can access in the secure system.">
        <div className="flex flex-wrap gap-2">
          {accessProfile.permissions.length ? (
            accessProfile.permissions.map((permission) => (
              <Badge key={permission} className="bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10">
                {permission}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-slate-300">This role has no elevated permissions yet.</p>
          )}
        </div>
      </Card>

      <Card title="System Modules" description="Direct entry points into the new role-aware workspace.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {accessibleModules.map((item) => (
            <Link key={item.to} to={item.to} className="rounded-3xl border border-slate-700 bg-slate-900/85 p-4 text-white transition-colors hover:border-cyan-400/30">
              <p className="font-semibold">{item.label}</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">{item.detail}</p>
            </Link>
          ))}
        </div>
        {!accessibleModules.length ? <p className="mt-4 text-sm text-slate-300">This role currently has no additional system modules assigned.</p> : null}
      </Card>
    </div>
  )
}
