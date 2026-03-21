import { AccessProfile, Permission, Role, RoleDefinition } from '../types'

export const rolePermissions: Record<Role, Permission[]> = {
  SuperAdmin: ['manage_users', 'assign_roles', 'view_reports', 'upload_marks', 'view_marks', 'manage_content', 'publish_news', 'manage_discipline', 'manage_finance'],
  Headmaster: ['manage_users', 'assign_roles', 'view_reports', 'upload_marks', 'view_marks', 'manage_content', 'publish_news', 'manage_discipline', 'manage_finance'],
  AdmissionsOfficer: ['view_reports', 'manage_users'],
  DOS: ['manage_users', 'assign_roles', 'view_reports', 'upload_marks', 'view_marks', 'manage_content', 'publish_news'],
  DOD: ['view_reports', 'manage_discipline'],
  Bursar: ['view_reports', 'manage_finance'],
  HOD: ['manage_users', 'assign_roles', 'view_reports', 'upload_marks', 'view_marks'],
  Teacher: ['upload_marks', 'view_marks'],
  Student: ['view_marks'],
  StudentLeader: ['view_marks', 'view_reports'],
  Animator: ['view_reports'],
  Animatress: ['view_reports'],
  Parent: ['view_marks'],
  ParentLeader: ['view_reports'],
  ContentManager: ['manage_content', 'publish_news'],
  Applicant: [],
  Guest: [],
}

export const roleDefinitions: RoleDefinition[] = [
  { role: 'SuperAdmin', description: 'Full platform control with unrestricted access to users, roles, reports, academics, content, discipline, and finance.', permissions: rolePermissions.SuperAdmin },
  { role: 'Headmaster', description: 'School-wide leadership access aligned with admin-level oversight across operations, academics, content, discipline, and finance.', permissions: rolePermissions.Headmaster },
  { role: 'AdmissionsOfficer', description: 'Admissions operations role for applications, applicant follow-up, and enrollment coordination.', permissions: rolePermissions.AdmissionsOfficer },
  { role: 'DOS', description: 'Director of Studies access across academic coordination, learning delivery, class assignments, and teaching oversight.', permissions: rolePermissions.DOS },
  { role: 'DOD', description: 'Discipline oversight and institutional case management.', permissions: rolePermissions.DOD },
  { role: 'Bursar', description: 'Financial management and reporting visibility.', permissions: rolePermissions.Bursar },
  { role: 'HOD', description: 'Minimum leadership-admin layer for department operations, user coordination, and academic oversight.', permissions: rolePermissions.HOD },
  { role: 'Teacher', description: 'Marks entry and academic visibility for classroom workflows.', permissions: rolePermissions.Teacher },
  { role: 'Student', description: 'Student-facing access for permitted academic information.', permissions: rolePermissions.Student },
  { role: 'StudentLeader', description: 'Student leadership role with limited reporting visibility.', permissions: rolePermissions.StudentLeader },
  { role: 'Animator', description: 'Student activity leader role for discipline and school organization support.', permissions: rolePermissions.Animator },
  { role: 'Animatress', description: 'Student activity leader role for discipline and school organization support.', permissions: rolePermissions.Animatress },
  { role: 'Parent', description: 'Guardian access focused on learner outcomes.', permissions: rolePermissions.Parent },
  { role: 'ParentLeader', description: 'Parent leadership with expanded reporting visibility.', permissions: rolePermissions.ParentLeader },
  { role: 'ContentManager', description: 'Website publishing and content governance role.', permissions: rolePermissions.ContentManager },
  { role: 'Applicant', description: 'Onboarding-only role for pre-admission users.', permissions: rolePermissions.Applicant },
  { role: 'Guest', description: 'Minimal access profile with no privileged permissions.', permissions: rolePermissions.Guest },
]

const roleAliases: Array<{ match: string; role: Role }> = [
  { match: 'superadmin', role: 'SuperAdmin' },
  { match: 'headmaster', role: 'Headmaster' },
  { match: 'admission', role: 'AdmissionsOfficer' },
  { match: 'admissions', role: 'AdmissionsOfficer' },
  { match: 'dos', role: 'DOS' },
  { match: 'dod', role: 'DOD' },
  { match: 'bursar', role: 'Bursar' },
  { match: 'hod', role: 'HOD' },
  { match: 'teacher', role: 'Teacher' },
  { match: 'studentleader', role: 'StudentLeader' },
  { match: 'animator', role: 'Animator' },
  { match: 'animatress', role: 'Animatress' },
  { match: 'student', role: 'Student' },
  { match: 'parentleader', role: 'ParentLeader' },
  { match: 'parent', role: 'Parent' },
  { match: 'content', role: 'ContentManager' },
  { match: 'applicant', role: 'Applicant' },
]

const formatDisplayName = (email: string | null) => {
  if (!email) return 'Guest User'
  const localPart = email.split('@')[0].replace(/[._-]+/g, ' ')
  return localPart.replace(/\b\w/g, (character) => character.toUpperCase())
}

export const resolveRoleFromEmail = (email: string | null, adminEmails: string[] = []): Role => {
  if (!email) return 'Guest'
  const normalized = email.toLowerCase()
  if (adminEmails.includes(normalized)) return 'SuperAdmin'
  const localPart = normalized.split('@')[0]
  return roleAliases.find((item) => localPart.includes(item.match))?.role ?? 'Guest'
}

export const buildAccessProfile = (email: string | null, adminEmails: string[] = []): AccessProfile => {
  const role = resolveRoleFromEmail(email, adminEmails)
  return { email, displayName: formatDisplayName(email), role, permissions: rolePermissions[role] }
}

export function can(userRoles: Role[], requiredPermission: Permission): boolean {
  return userRoles.some((role) => rolePermissions[role]?.includes(requiredPermission))
}

export function canAny(userRoles: Role[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.some((permission) => can(userRoles, permission))
}

export function canAll(userRoles: Role[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.every((permission) => can(userRoles, permission))
}

export const hasPermission = (profile: AccessProfile, permission: Permission) => can([profile.role], permission)
export const hasAnyPermission = (profile: AccessProfile, permissions: Permission[]) => canAny([profile.role], permissions)
export const hasAllPermissions = (profile: AccessProfile, permissions: Permission[]) => canAll([profile.role], permissions)
export const hasRole = (profile: AccessProfile, roles: Role[]) => roles.includes(profile.role)

export const invitePermissions: Record<Role, Role[]> = {
  SuperAdmin: [
    'SuperAdmin',
    'Headmaster',
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
  ],
  Headmaster: [
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
  ],
  AdmissionsOfficer: ['Applicant', 'Student', 'Guest'],
  DOS: ['HOD', 'Teacher', 'Student', 'StudentLeader', 'Applicant', 'Guest'],
  DOD: ['Student', 'StudentLeader', 'Animator', 'Animatress', 'ParentLeader', 'Parent', 'Applicant', 'Guest'],
  Bursar: ['Applicant', 'Guest'],
  HOD: ['Teacher', 'Student', 'StudentLeader', 'Applicant', 'Guest'],
  Teacher: ['Student', 'StudentLeader', 'Applicant'],
  Student: [],
  StudentLeader: ['Student'],
  Animator: ['Student'],
  Animatress: ['Student'],
  Parent: [],
  ParentLeader: ['Parent'],
  ContentManager: ['Applicant', 'Guest'],
  Applicant: [],
  Guest: [],
}

export const getInvitableRoles = (role: Role) => invitePermissions[role] ?? []
export const canInviteRole = (inviterRole: Role, targetRole: Role) => getInvitableRoles(inviterRole).includes(targetRole)
