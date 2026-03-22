import { BookOpen, BrainCircuit, CreditCard, FileText, Home, LayoutDashboard, Shield, UserCog, UserPlus, Users } from 'lucide-react'
import { requireAnyRole, requirePermission } from './authMiddleware'
import { AccessProfile, Permission, Role } from '../types'

export interface SystemNavItem {
  label: string
  to: string
  detail: string
  icon: typeof Home
  headerShortcut?: boolean
  permission?: Permission
  roles?: Role[]
}

export const systemNavItems: SystemNavItem[] = [
  { label: 'Dashboard', to: '/system', icon: Home, detail: 'Your secure role-aware starting point.', headerShortcut: true },
  {
    label: 'Applications',
    to: '/system/applications',
    icon: FileText,
    detail: 'Review admissions, decisions, and applicant communication.',
    roles: ['SuperAdmin', 'Headmaster', 'AdmissionsOfficer', 'DOS', 'HOD'],
  },
  {
    label: 'Student Dashboard',
    to: '/system/student-dashboard',
    icon: BookOpen,
    detail: 'Progress, tasks, and learner visibility.',
    permission: 'view_marks',
  },
  {
    label: 'Control Center',
    to: '/system/control-center',
    icon: LayoutDashboard,
    detail: 'Operations, team visibility, and leadership signals.',
    permission: 'view_reports',
  },
  {
    label: 'AI Hub',
    to: '/system/ai-hub',
    icon: BrainCircuit,
    detail: 'Internal system AI for role-aware analysis, prompts, and operational insights.',
    permission: 'view_reports',
    headerShortcut: true,
  },
  {
    label: 'GILBERT',
    to: '/system/gilbert',
    icon: BrainCircuit,
    detail: 'Review the public website assistant, its visibility, and visitor conversations separately from the internal AI Hub.',
    permission: 'view_reports',
  },
  {
    label: 'My Profile',
    to: '/system/profile',
    icon: UserCog,
    detail: 'Update your own profile details and password securely.',
  },
  {
    label: 'Users',
    to: '/system/users',
    icon: Users,
    detail: 'Manage people, statuses, and account access.',
    permission: 'manage_users',
  },
  {
    label: 'Roles',
    to: '/system/roles',
    icon: UserCog,
    detail: 'Review role definitions and permission coverage.',
    permission: 'assign_roles',
  },
  {
    label: 'Classes',
    to: '/system/academics',
    icon: BookOpen,
    detail: 'Open class spaces, resources, marks, and learner views.',
    roles: ['SuperAdmin', 'Headmaster', 'DOS', 'HOD', 'Teacher', 'Student', 'StudentLeader', 'Parent', 'ParentLeader'],
  },
  {
    label: 'Class Operations',
    to: '/system/class-operations',
    icon: LayoutDashboard,
    detail: 'Carry leadership responsibilities across assignments, movement, and class oversight.',
    roles: ['SuperAdmin', 'Headmaster', 'DOS', 'HOD', 'DOD'],
  },
  {
    label: 'Timetable',
    to: '/system/timetable',
    icon: LayoutDashboard,
    detail: 'Generate, review, and export the full school timetable with conflict-aware teacher scheduling.',
    roles: ['SuperAdmin', 'Headmaster', 'DOS', 'HOD', 'DOD'],
  },
  {
    label: 'Content',
    to: '/system/content',
    icon: FileText,
    detail: 'Coordinate publishing, updates, and subscriber visibility.',
    roles: ['SuperAdmin', 'Headmaster', 'ContentManager', 'DOS', 'DOD', 'HOD'],
  },
  {
    label: 'Discipline',
    to: '/system/discipline',
    icon: Shield,
    detail: 'Follow discipline cases and institutional actions.',
    permission: 'manage_discipline',
    headerShortcut: true,
  },
  {
    label: 'Finance',
    to: '/system/finance',
    icon: CreditCard,
    detail: 'Review bursar-focused indicators and finance health.',
    permission: 'manage_finance',
    headerShortcut: true,
  },
  {
    label: 'Invite',
    to: '/system/invite',
    icon: UserPlus,
    detail: 'Create secure one-time onboarding links.',
    roles: ['SuperAdmin', 'Headmaster', 'AdmissionsOfficer', 'DOS', 'DOD', 'Bursar', 'HOD', 'Teacher', 'Student', 'StudentLeader', 'Animator', 'Animatress', 'ParentLeader', 'ContentManager'],
  },
]

export function getAccessibleSystemNav(profile: AccessProfile) {
  return systemNavItems.filter(
    (item) =>
      (!item.permission || requirePermission(profile, item.permission)) &&
      (!item.roles || requireAnyRole(profile, item.roles))
  )
}

export function getHeaderSystemNav(profile: AccessProfile) {
  return getAccessibleSystemNav(profile).filter((item) => item.headerShortcut)
}

export function getSidebarSystemNav(profile: AccessProfile) {
  return getAccessibleSystemNav(profile).filter((item) => !item.headerShortcut)
}
