import { Application } from '@/types/database'
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

export const buildDecisionNote = (
  status: Application['status'],
  applicantName: string,
  grade: string
) => {
  if (status === 'admitted') {
    return `Congratulations ${applicantName}. You have been admitted to ${grade} at Nyagatare Secondary School. Please review your next-step instructions and create your applicant account to continue onboarding.`
  }

  if (status === 'rejected') {
    return `Dear ${applicantName}, after reviewing your application for ${grade}, we regret to inform you that you have not been admitted in this intake. Please review this decision and contact admissions if you need clarification on the outcome.`
  }

  return ''
}
