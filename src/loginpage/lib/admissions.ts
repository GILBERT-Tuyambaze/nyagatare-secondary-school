import { Role } from '../types'

export const admissionsDecisionStatuses = ['pending', 'review', 'admitted', 'waitlist', 'rejected'] as const

export const admissionsManagers: Role[] = [
  'SuperAdmin',
  'Headmaster',
  'AdmissionsOfficer',
  'DOS',
  'HOD',
]

export const canManageAdmissions = (role: Role) => admissionsManagers.includes(role)
