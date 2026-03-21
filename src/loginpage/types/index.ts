export type Role =
  | 'SuperAdmin'
  | 'Headmaster'
  | 'AdmissionsOfficer'
  | 'DOS'
  | 'DOD'
  | 'Bursar'
  | 'HOD'
  | 'Teacher'
  | 'Student'
  | 'StudentLeader'
  | 'Animator'
  | 'Animatress'
  | 'Parent'
  | 'ParentLeader'
  | 'ContentManager'
  | 'Applicant'
  | 'Guest'

export type Permission =
  | 'manage_users'
  | 'assign_roles'
  | 'view_reports'
  | 'upload_marks'
  | 'view_marks'
  | 'manage_content'
  | 'publish_news'
  | 'manage_discipline'
  | 'manage_finance'

export interface AccessProfile {
  email: string | null
  displayName: string
  fullName?: string
  role: Role
  permissions: Permission[]
  department?: string
  status?: 'active' | 'invited' | 'suspended'
  isGhost?: boolean
  isProtected?: boolean
}

export interface SystemUser {
  id: string
  fullName: string
  email: string
  role: Role
  permissions: Permission[]
  status: 'active' | 'invited' | 'suspended'
  department: string
  isGhost?: boolean
  isProtected?: boolean
}

export interface RoleDefinition {
  role: Role
  description: string
  permissions: Permission[]
}

export interface Invite {
  id: string
  email: string
  role: Role
  applicationId?: string
  invitedBy: string
  invitedByUid?: string
  invitedByRole?: Role
  status: 'pending' | 'accepted' | 'expired'
  expiresAt: string
  createdAt?: string
  signupUrl?: string
  acceptedAt?: string
  acceptedByUid?: string
}

export interface AcademicOverview {
  department: string
  completionRate: string
  lead: string
  status: 'On Track' | 'Needs Review' | 'Excellent'
}

export interface ContentItem {
  id: string
  title: string
  type: 'News' | 'Event' | 'Announcement'
  status: 'Draft' | 'Review' | 'Published'
  updatedAt: string
}

export interface DisciplineItem {
  id: string
  caseTitle: string
  owner: string
  severity: 'Low' | 'Medium' | 'High'
  status: 'Open' | 'Monitoring' | 'Resolved'
}

export interface FinanceItem {
  id: string
  label: string
  amount: string
  status: 'Healthy' | 'Attention' | 'Critical'
}

export interface StudentMetric {
  label: string
  value: string
  trend: string
}

export interface StudentTask {
  id: string
  title: string
  due: string
  status: 'Pending' | 'Submitted' | 'Complete'
}

export interface ControlStat {
  label: string
  value: string
  note: string
}

export interface ChatMessage {
  id: string
  speaker: 'assistant' | 'user'
  message: string
}

export interface AnalyticsInsight {
  id: string
  title: string
  summary: string
  confidence: string
}

export interface Classroom {
  id: string
  name: string
  department: string
  created_by: string
  head_teacher_id: string
  student_leader_id?: string
  created_at: string
}

export interface ClassStudent {
  id: string
  class_id: string
  student_id: string
}

export interface ClassPost {
  id: string
  class_id: string
  posted_by: string
  type: 'lesson' | 'assignment' | 'holiday_work' | 'announcement'
  title: string
  content: string
  attachments?: string[]
  created_at: string
}
