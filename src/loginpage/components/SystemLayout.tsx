import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const pageCopy: Record<string, { title: string; description: string }> = {
  '/system': {
    title: 'Dashboard Landing',
    description: 'A secure overview of the RBAC workspace and the modules your role can access.',
  },
  '/system/users': {
    title: 'User Management',
    description: 'Inspect users, departments, status, and role-based access assignments.',
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
    title: 'AI Chatbot + Analytics Hub',
    description: 'Conversational support plus insight cards for school decision-making.',
  },
  '/system/roles': {
    title: 'Roles & Permissions',
    description: 'Review the current role model and the permission coverage attached to each role.',
  },
  '/system/academics': {
    title: 'Academics Management',
    description: 'Track department performance and instructional readiness.',
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
    title: 'Invite Signup',
    description: 'Create one-time role-based invitations for new users.',
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
