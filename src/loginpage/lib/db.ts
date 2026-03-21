import {
  AcademicOverview,
  AnalyticsInsight,
  ChatMessage,
  ContentItem,
  ControlStat,
  DisciplineItem,
  FinanceItem,
  Invite,
  StudentMetric,
  StudentTask,
  SystemUser,
} from '../types'
import { roleDefinitions } from './rbac'

const getPermissions = (role: SystemUser['role']) =>
  roleDefinitions.find((definition) => definition.role === role)?.permissions ?? []

export const systemUsers: SystemUser[] = [
  { id: 'usr-1', fullName: 'System Ghost', email: 'gilberttuyambaze00@gmail.com', role: 'SuperAdmin', permissions: getPermissions('SuperAdmin'), status: 'active', department: 'Digital Operations', isGhost: true, isProtected: true },
  { id: 'usr-2', fullName: 'Jane Mukamana', email: 'headmaster@nyagataress.edu.rw', role: 'Headmaster', permissions: getPermissions('Headmaster'), status: 'active', department: 'Leadership' },
  { id: 'usr-5', fullName: 'Alice Uwera', email: 'admissions.office@nyagataress.edu.rw', role: 'AdmissionsOfficer', permissions: getPermissions('AdmissionsOfficer'), status: 'active', department: 'Admissions' },
  { id: 'usr-3', fullName: 'Eric Habimana', email: 'teacher.math@nyagataress.edu.rw', role: 'Teacher', permissions: getPermissions('Teacher'), status: 'active', department: 'Academics' },
  { id: 'usr-4', fullName: 'Aline Uwase', email: 'bursar@nyagataress.edu.rw', role: 'Bursar', permissions: getPermissions('Bursar'), status: 'invited', department: 'Finance' },
]

export const invites: Invite[] = [
  { id: 'inv-1', email: 'content@nyagataress.edu.rw', role: 'ContentManager', invitedBy: 'Gilbert Tuyambaze', invitedByRole: 'SuperAdmin', status: 'pending', expiresAt: '2026-03-31', createdAt: '2026-03-20T05:00:00.000Z' },
  { id: 'inv-2', email: 'parentleader@nyagataress.edu.rw', role: 'ParentLeader', invitedBy: 'Jane Mukamana', invitedByRole: 'Headmaster', status: 'accepted', expiresAt: '2026-03-25', createdAt: '2026-03-19T05:00:00.000Z' },
]

export const academicsOverview: AcademicOverview[] = [
  { department: 'Mathematics', completionRate: '92%', lead: 'Eric Habimana', status: 'Excellent' },
  { department: 'Sciences', completionRate: '87%', lead: 'Diane Mutesi', status: 'On Track' },
  { department: 'Languages', completionRate: '74%', lead: 'Grace Mukamana', status: 'Needs Review' },
]

export const contentItems: ContentItem[] = [
  { id: 'cnt-1', title: 'STEM Fair 2026 Launch', type: 'News', status: 'Published', updatedAt: '2 hours ago' },
  { id: 'cnt-2', title: 'Scholarship Notice', type: 'Announcement', status: 'Review', updatedAt: 'Today' },
  { id: 'cnt-3', title: 'Parent Leadership Forum', type: 'Event', status: 'Draft', updatedAt: 'Yesterday' },
]

export const disciplineItems: DisciplineItem[] = [
  { id: 'dis-1', caseTitle: 'Dormitory conduct review', owner: 'Dean of Discipline', severity: 'Medium', status: 'Monitoring' },
  { id: 'dis-2', caseTitle: 'Attendance escalation', owner: 'Class Mentor', severity: 'High', status: 'Open' },
  { id: 'dis-3', caseTitle: 'Uniform compliance follow-up', owner: 'Patron', severity: 'Low', status: 'Resolved' },
]

export const financeItems: FinanceItem[] = [
  { id: 'fin-1', label: 'Fee Collection Health', amount: 'RWF 18.2M', status: 'Healthy' },
  { id: 'fin-2', label: 'Outstanding Balances', amount: 'RWF 2.1M', status: 'Attention' },
  { id: 'fin-3', label: 'Emergency Reserve', amount: 'RWF 6.4M', status: 'Healthy' },
]

export const studentMetrics: StudentMetric[] = [
  { label: 'Attendance', value: '96%', trend: '+2% this month' },
  { label: 'Average Score', value: '84%', trend: '+5% from last term' },
  { label: 'Assignments', value: '12/14', trend: '2 pending tasks' },
]

export const studentTasks: StudentTask[] = [
  { id: 'tsk-1', title: 'Submit biology lab report', due: 'Tomorrow', status: 'Pending' },
  { id: 'tsk-2', title: 'Mathematics CAT review', due: 'Friday', status: 'Submitted' },
  { id: 'tsk-3', title: 'Career guidance survey', due: 'Completed', status: 'Complete' },
]

export const controlStats: ControlStat[] = [
  { label: 'Open Admin Actions', value: '18', note: 'Needs assignment across leadership teams' },
  { label: 'Enrollment Reviews', value: '23', note: 'Pending admissions decisions this week' },
  { label: 'Content Approvals', value: '7', note: 'Awaiting publishing sign-off' },
  { label: 'Operational Alerts', value: '4', note: 'Discipline and finance escalations flagged' },
]

export const chatbotMessages: ChatMessage[] = [
  { id: 'msg-1', speaker: 'user', message: 'Show me the most urgent school operations today.' },
  { id: 'msg-2', speaker: 'assistant', message: 'The top priorities are pending enrollment reviews, two finance balance alerts, and one high-severity discipline case.' },
  { id: 'msg-3', speaker: 'user', message: 'Which academic department needs the most support?' },
  { id: 'msg-4', speaker: 'assistant', message: 'Languages is trending below target completion and should be reviewed by the DOS or HOD this week.' },
]

export const analyticsInsights: AnalyticsInsight[] = [
  { id: 'ins-1', title: 'Admissions velocity increased', summary: 'Application review throughput is trending up after board and admissions coordination improved.', confidence: '92%' },
  { id: 'ins-2', title: 'Language department needs intervention', summary: 'Completion lag and lower assessment trends suggest targeted support is needed.', confidence: '88%' },
  { id: 'ins-3', title: 'Fee collections remain healthy', summary: 'Collections are strong overall, but a smaller pocket of overdue balances needs bursar follow-up.', confidence: '90%' },
]
