import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { BookOpen, BrainCircuit, CreditCard, FileText, Home, LayoutDashboard, Shield, UserCog, UserPlus, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { requireAnyRole, requirePermission } from '../lib/authMiddleware'
import { AccessProfile, Permission, Role } from '../types'

const navItems: Array<{
  label: string
  to: string
  icon: typeof Home
  permission?: Permission
  roles?: Role[]
}> = [
  { label: 'Dashboard', to: '/system', icon: Home },
  { label: 'Applications', to: '/system/applications', icon: FileText, roles: ['SuperAdmin', 'Headmaster', 'AdmissionsOfficer', 'DOS', 'HOD'] },
  { label: 'Student', to: '/system/student-dashboard', icon: BookOpen, permission: 'view_marks' },
  { label: 'Control Center', to: '/system/control-center', icon: LayoutDashboard, permission: 'view_reports' },
  { label: 'AI Hub', to: '/system/ai-hub', icon: BrainCircuit, permission: 'view_reports' },
  { label: 'Users', to: '/system/users', icon: Users, permission: 'manage_users' },
  { label: 'Roles', to: '/system/roles', icon: UserCog, permission: 'assign_roles' },
  { label: 'Academics', to: '/system/academics', icon: BookOpen, permission: 'view_marks' },
  { label: 'Content', to: '/system/content', icon: FileText, permission: 'manage_content' },
  { label: 'Discipline', to: '/system/discipline', icon: Shield, permission: 'manage_discipline' },
  { label: 'Finance', to: '/system/finance', icon: CreditCard, permission: 'manage_finance' },
  { label: 'Invite', to: '/system/invite', icon: UserPlus, permission: 'assign_roles' },
]

export function Sidebar({ profile }: { profile: AccessProfile }) {
  return (
    <aside className="w-full border-b border-slate-800 bg-slate-950/95 p-4 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">LoginPage</p>
        <h1 className="mt-2 text-2xl font-bold text-white">NSS RBAC Core</h1>
        <p className="mt-2 text-sm text-slate-300">A secure module system rooted in roles and permissions.</p>
      </div>

      <div className="mb-6 rounded-2xl border border-cyan-400/25 bg-cyan-500/12 p-4">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-100">Current Role</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-medium text-white">{profile.displayName}</span>
          <Badge className="bg-cyan-200 text-slate-950 hover:bg-cyan-200">{profile.role}</Badge>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems
          .filter(
            (item) =>
              (!item.permission || requirePermission(profile, item.permission)) &&
              (!item.roles || requireAnyRole(profile, item.roles))
          )
          .map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/system'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors',
                    isActive
                      ? 'bg-cyan-500/12 text-cyan-100'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            )
          })}
      </nav>
    </aside>
  )
}
