import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const pageCopy: Record<string, { title: string; description: string }> = {
  '/system': {
    title: 'System Home',
    description: 'A role-aware starting point for school operations, class work, and secure module access.',
  },
  '/system/users': {
    title: 'User Management',
    description: 'Inspect users, departments, status, and role-based access assignments.',
  },
  '/system/profile': {
    title: 'My Profile',
    description: 'Update your own profile details, department, and password from one protected workspace.',
  },
  '/system/applications': {
    title: 'Admissions Workspace',
    description: 'Review applications, update admissions decisions, and follow up with applicants.',
  },
  '/system/student-dashboard': {
    title: 'Student Dashboard',
    description: 'A learner-first workspace for progress, tasks, and academic visibility.',
  },
  '/system/control-center': {
    title: 'Staff/Admin Control Center',
    description: 'A leadership and operations hub for coordinated school management.',
  },
  '/system/ai-hub': {
    title: 'AI Hub',
    description: 'Internal system AI for staff prompts, analysis, and operational support.',
  },
  '/system/gilbert': {
    title: 'GILBERT',
    description: 'Review the public website assistant, its visibility, and visitor conversation summaries.',
  },
  '/system/roles': {
    title: 'Roles & Permissions',
    description: 'Review the current role model and the permission coverage attached to each role.',
  },
  '/system/academics': {
    title: 'Classes and Academics',
    description: 'Open class spaces, learning resources, marks, messaging, and academic delivery tools.',
  },
  '/system/class-operations': {
    title: 'Class Operations',
    description: 'Create classes, assign teachers, place students, and coordinate leadership actions across the class system.',
  },
  '/system/timetable': {
    title: 'Timetable Studio',
    description: 'Build, validate, and export the school timetable with DOS-led workflow and teacher conflict prevention.',
  },
  '/system/content': {
    title: 'Content Manager',
    description: 'Coordinate publishing, news updates, and content review states.',
  },
  '/system/discipline': {
    title: 'Discipline Operations',
    description: 'Manage discipline cases and monitor institutional follow-ups.',
  },
  '/system/finance': {
    title: 'Finance Desk',
    description: 'Review bursar-oriented indicators and finance health snapshots.',
  },
  '/system/invite': {
    title: 'Invite Center',
    description: 'Create one-time invitations, including parent-to-student links and role-based onboarding.',
  },
}

export function SystemLayout() {
  const location = useLocation()
  const { accessProfile, signOut } = useAuth()
  const currentPage = pageCopy[location.pathname] ?? pageCopy['/system']

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header variant="system" />
      <div className="lg:flex">
        <Sidebar profile={accessProfile} />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar
            profile={accessProfile}
            title={currentPage.title}
            description={currentPage.description}
            onSignOut={signOut}
          />
          <main className="flex-1 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_30%),linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(2,6,23,1))] p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <Footer variant="system" />
    </div>
  )
}
