import { User } from 'firebase/auth'
import { collection, doc, getDocs, query, setDoc, where, writeBatch } from 'firebase/firestore'
import { db } from '@/firebase'
import {
  ActivityLog,
  Application,
  BoardMember,
  ChatMessage,
  ChatThread,
  ClassTeacherAssignment,
  DisciplineCase,
  Donation,
  Event,
  LearningResource,
  MarkComment,
  SchoolSubject,
  Student,
  StudentMark,
} from '@/types/database'
import { ClassPost, Classroom, ClassStudent, Invite, SystemUser } from '../types'
import { rolePermissions } from './rbac'
import { invites, systemUsers } from './db'

const seededStudents: Student[] = [
  {
    id: 'student-1',
    student_id: 'NSS-STU-001',
    first_name: 'Aline',
    last_name: 'Uwase',
    date_of_birth: '2008-05-14',
    gender: 'female',
    phone: '+250788000101',
    email: 'student.aline@nyagataress.edu.rw',
    address: 'Nyagatare Sector',
    status: 'active',
    created_at: '2026-03-01T08:00:00.000Z',
    updated_at: '2026-03-01T08:00:00.000Z',
  },
  {
    id: 'student-2',
    student_id: 'NSS-STU-002',
    first_name: 'Claude',
    last_name: 'Habimana',
    date_of_birth: '2007-11-02',
    gender: 'male',
    phone: '+250788000102',
    email: 'student.claude@nyagataress.edu.rw',
    address: 'Rukomo Sector',
    status: 'active',
    created_at: '2026-03-02T08:00:00.000Z',
    updated_at: '2026-03-02T08:00:00.000Z',
  },
]

const seededApplications: Application[] = [
  {
    id: 'application-1',
    application_id: 'APP-2026-101001',
    first_name: 'Kevin',
    last_name: 'Nshimiyimana',
    date_of_birth: '2011-01-06',
    gender: 'male',
    phone: '+250788000201',
    email: 'kevin.parent@email.com',
    address: 'Nyagatare District',
    guardian_name: 'Jean Nshimiyimana',
    guardian_relationship: 'Father',
    guardian_phone: '+250788000301',
    guardian_email: 'jean.nshimiyimana@email.com',
    guardian_occupation: 'Farmer',
    emergency_contact: 'Martha Nshimiyimana +250788000401',
    previous_school: 'Nyagatare Primary School',
    applying_grade: 'Grade 7 (S1)',
    academic_year: '2026',
    preferred_subjects: 'Mathematics, Physics',
    achievements: 'District science fair finalist',
    motivation: 'I want to join NSS to grow in STEM and robotics.',
    status: 'pending',
    score: 78,
    admin_notes: '',
    reviewed_by: '',
    reviewed_at: '',
    created_at: '2026-03-05T09:00:00.000Z',
    updated_at: '2026-03-05T09:00:00.000Z',
  },
  {
    id: 'application-2',
    application_id: 'APP-2026-101002',
    first_name: 'Diane',
    last_name: 'Mukamana',
    date_of_birth: '2010-09-18',
    gender: 'female',
    phone: '+250788000202',
    email: 'diane.guardian@email.com',
    address: 'Tabagwe Sector',
    guardian_name: 'Grace Mukamana',
    guardian_relationship: 'Mother',
    guardian_phone: '+250788000302',
    guardian_email: 'grace.guardian@email.com',
    guardian_occupation: 'Teacher',
    emergency_contact: 'Pascal Mugisha +250788000402',
    previous_school: 'Tabagwe Academy',
    applying_grade: 'Grade 10 (S4)',
    academic_year: '2026',
    preferred_subjects: 'Biology, Chemistry',
    achievements: 'Top 5 national exam rank',
    motivation: 'I want a stronger science environment and leadership opportunities.',
    status: 'review',
    score: 91,
    admin_notes: 'Excellent academic potential.',
    reviewed_by: 'Jane Mukamana',
    reviewed_at: '2026-03-10T13:00:00.000Z',
    created_at: '2026-03-06T09:30:00.000Z',
    updated_at: '2026-03-10T13:00:00.000Z',
  },
]

const seededEvents: Event[] = [
  {
    id: 'event-1',
    title: 'STEM Innovation Day',
    description: 'A school-wide showcase for science and technology projects.',
    event_date: '2026-04-12',
    start_time: '09:00',
    end_time: '15:00',
    location: 'Main Hall',
    category: 'academic',
    max_attendees: 400,
    current_attendees: 210,
    status: 'upcoming',
    image_url: '',
    created_by: 'Gilbert Tuyambaze',
    created_at: '2026-03-07T10:00:00.000Z',
    updated_at: '2026-03-07T10:00:00.000Z',
  },
  {
    id: 'event-2',
    title: 'Parents Leadership Forum',
    description: 'Discussion forum on digital communication and school progress.',
    event_date: '2026-04-20',
    start_time: '14:00',
    end_time: '17:00',
    location: 'Conference Room',
    category: 'meeting',
    max_attendees: 120,
    current_attendees: 48,
    status: 'upcoming',
    image_url: '',
    created_by: 'Jane Mukamana',
    created_at: '2026-03-08T10:00:00.000Z',
    updated_at: '2026-03-08T10:00:00.000Z',
  },
]

const seededDonations: Donation[] = [
  {
    id: 'donation-1',
    donor_name: 'NSS Alumni Association',
    donor_email: 'alumni@nss.org',
    donor_phone: '+250788000501',
    amount: 2500000,
    currency: 'RWF',
    donation_type: 'equipment',
    payment_method: 'bank-transfer',
    payment_status: 'completed',
    payment_reference: 'TRX-ALUMNI-2026',
    message: 'For science lab equipment.',
    is_anonymous: false,
    created_at: '2026-03-03T12:00:00.000Z',
    updated_at: '2026-03-03T12:00:00.000Z',
  },
  {
    id: 'donation-2',
    donor_name: 'Community Partner',
    donor_email: 'partner@email.com',
    donor_phone: '+250788000502',
    amount: 900000,
    currency: 'RWF',
    donation_type: 'scholarship',
    payment_method: 'mobile-money',
    payment_status: 'completed',
    payment_reference: 'TRX-COMMUNITY-2026',
    message: 'Scholarship support for two learners.',
    is_anonymous: false,
    created_at: '2026-03-04T12:00:00.000Z',
    updated_at: '2026-03-04T12:00:00.000Z',
  },
]

const seededBoardMembers: BoardMember[] = [
  {
    id: 'board-1',
    full_name: 'Jane Mukamana',
    position: 'Headmaster',
    category: 'leader',
    bio: 'Leads the school with a strong focus on STEM excellence and student welfare.',
    profile_image: '',
    email: 'headmaster@nyagataress.edu.rw',
    phone: '+250788000601',
    qualifications: 'MEd Educational Leadership',
    experience_years: 12,
    is_active: true,
    created_at: '2026-03-01T08:00:00.000Z',
    updated_at: '2026-03-01T08:00:00.000Z',
  },
  {
    id: 'board-2',
    full_name: 'Eric Habimana',
    position: 'Head of Mathematics',
    category: 'teacher',
    bio: 'Coordinates mathematics instruction and mentoring.',
    profile_image: '',
    email: 'teacher.math@nyagataress.edu.rw',
    phone: '+250788000602',
    qualifications: 'BSc Mathematics Education',
    experience_years: 8,
    is_active: true,
    created_at: '2026-03-01T08:00:00.000Z',
    updated_at: '2026-03-01T08:00:00.000Z',
  },
]

const seededClasses: Classroom[] = [
  {
    id: 'class-1',
    name: 'Senior 5 Science A',
    department: 'Science',
    created_by: 'usr-2',
    head_teacher_id: 'usr-3',
    student_leader_id: 'student-1',
    created_at: '2026-03-01T08:00:00.000Z',
  },
  {
    id: 'class-2',
    name: 'Senior 4 General Studies',
    department: 'General',
    created_by: 'usr-2',
    head_teacher_id: 'usr-3',
    student_leader_id: 'student-2',
    created_at: '2026-03-02T08:00:00.000Z',
  },
]

const seededSubjects: SchoolSubject[] = [
  { id: 'subject-1', name: 'Mathematics', code: 'MATH', department: 'Science', created_at: '2026-03-01T08:00:00.000Z', updated_at: '2026-03-01T08:00:00.000Z' },
  { id: 'subject-2', name: 'Physics', code: 'PHYS', department: 'Science', created_at: '2026-03-01T08:00:00.000Z', updated_at: '2026-03-01T08:00:00.000Z' },
  { id: 'subject-3', name: 'English', code: 'ENG', department: 'Languages', created_at: '2026-03-01T08:00:00.000Z', updated_at: '2026-03-01T08:00:00.000Z' },
]

const seededTeacherAssignments: ClassTeacherAssignment[] = [
  {
    id: 'assignment-1',
    class_id: 'class-1',
    teacher_user_id: 'usr-3',
    teacher_name: 'Eric Habimana',
    subject_id: 'subject-1',
    subject_name: 'Mathematics',
    academic_year: '2026',
    term: 'Term 1',
    can_invite_students: true,
    can_invite_parents: false,
    can_change_class: false,
    created_at: '2026-03-02T08:00:00.000Z',
    updated_at: '2026-03-02T08:00:00.000Z',
  },
  {
    id: 'assignment-2',
    class_id: 'class-1',
    teacher_user_id: 'usr-2',
    teacher_name: 'Jane Mukamana',
    subject_id: 'subject-2',
    subject_name: 'Physics',
    academic_year: '2026',
    term: 'Term 1',
    can_invite_students: false,
    can_invite_parents: false,
    can_change_class: true,
    created_at: '2026-03-02T09:00:00.000Z',
    updated_at: '2026-03-02T09:00:00.000Z',
  },
]

const seededLearningResources: LearningResource[] = [
  {
    id: 'resource-1',
    class_id: 'class-1',
    subject_id: 'subject-1',
    subject_name: 'Mathematics',
    teacher_user_id: 'usr-3',
    teacher_name: 'Eric Habimana',
    type: 'assignment',
    title: 'Algebra Assignment 1',
    description: 'Complete the equations worksheet and submit before Friday.',
    due_date: '2026-03-25',
    created_at: '2026-03-12T08:00:00.000Z',
    updated_at: '2026-03-12T08:00:00.000Z',
  },
  {
    id: 'resource-2',
    class_id: 'class-1',
    subject_id: 'subject-2',
    subject_name: 'Physics',
    teacher_user_id: 'usr-2',
    teacher_name: 'Jane Mukamana',
    type: 'holiday_package',
    title: 'Mechanics Holiday Package',
    description: 'Use the holiday booklet to revise motion, force, and energy.',
    due_date: '2026-04-02',
    created_at: '2026-03-13T08:00:00.000Z',
    updated_at: '2026-03-13T08:00:00.000Z',
  },
  {
    id: 'resource-3',
    class_id: 'class-1',
    subject_id: 'subject-3',
    subject_name: 'English',
    teacher_user_id: 'usr-2',
    teacher_name: 'Jane Mukamana',
    type: 'notes',
    title: 'Academic Writing Notes',
    description: 'Study these notes on essay structure and formal writing.',
    created_at: '2026-03-14T08:00:00.000Z',
    updated_at: '2026-03-14T08:00:00.000Z',
  },
]

const seededStudentMarks: StudentMark[] = [
  {
    id: 'mark-1',
    class_id: 'class-1',
    student_id: 'student-1',
    student_name: 'Aline Uwase',
    subject_id: 'subject-1',
    subject_name: 'Mathematics',
    teacher_user_id: 'usr-3',
    teacher_name: 'Eric Habimana',
    score: 84,
    max_score: 100,
    term: 'Term 1',
    academic_year: '2026',
    comment: 'Strong algebra progress. Keep practicing word problems.',
    created_at: '2026-03-15T08:00:00.000Z',
    updated_at: '2026-03-15T08:00:00.000Z',
  },
  {
    id: 'mark-2',
    class_id: 'class-1',
    student_id: 'student-1',
    student_name: 'Aline Uwase',
    subject_id: 'subject-2',
    subject_name: 'Physics',
    teacher_user_id: 'usr-2',
    teacher_name: 'Jane Mukamana',
    score: 76,
    max_score: 100,
    term: 'Term 1',
    academic_year: '2026',
    comment: 'Good effort. Needs more confidence with calculations.',
    created_at: '2026-03-15T09:00:00.000Z',
    updated_at: '2026-03-15T09:00:00.000Z',
  },
]

const seededMarkComments: MarkComment[] = [
  {
    id: 'mark-comment-1',
    mark_id: 'mark-1',
    student_id: 'student-1',
    student_name: 'Aline Uwase',
    message: 'Thank you teacher, I will focus more on the word problems.',
    created_at: '2026-03-16T10:00:00.000Z',
  },
]

const seededChatThreads: ChatThread[] = [
  {
    id: 'thread-common-class-1',
    class_id: 'class-1',
    type: 'common',
    title: 'Senior 5 Science A Common Chat',
    created_at: '2026-03-10T08:00:00.000Z',
    updated_at: '2026-03-16T10:00:00.000Z',
  },
  {
    id: 'thread-private-math-student-1',
    class_id: 'class-1',
    type: 'private_subject',
    title: 'Aline Uwase and Mathematics Teacher',
    subject_id: 'subject-1',
    subject_name: 'Mathematics',
    student_id: 'student-1',
    teacher_user_id: 'usr-3',
    created_at: '2026-03-12T08:00:00.000Z',
    updated_at: '2026-03-16T10:00:00.000Z',
  },
]

const seededChatMessages: ChatMessage[] = [
  {
    id: 'message-1',
    thread_id: 'thread-common-class-1',
    sender_uid: 'usr-2',
    sender_name: 'Jane Mukamana',
    sender_role: 'Headmaster',
    message: 'Remember to submit all holiday work before the end of the week.',
    created_at: '2026-03-16T08:00:00.000Z',
  },
  {
    id: 'message-2',
    thread_id: 'thread-private-math-student-1',
    sender_uid: 'student-1',
    sender_name: 'Aline Uwase',
    sender_role: 'Student',
    message: 'Teacher, may I get extra guidance on quadratic equations?',
    created_at: '2026-03-16T09:00:00.000Z',
  },
  {
    id: 'message-3',
    thread_id: 'thread-private-math-student-1',
    sender_uid: 'usr-3',
    sender_name: 'Eric Habimana',
    sender_role: 'Teacher',
    message: 'Yes, I have uploaded a practice sheet. We will also revise together tomorrow.',
    created_at: '2026-03-16T09:10:00.000Z',
  },
]

const seededDisciplineCases: DisciplineCase[] = [
  {
    id: 'discipline-1',
    class_id: 'class-1',
    student_id: 'student-1',
    student_name: 'Aline Uwase',
    title: 'Late assignment submission',
    summary: 'Student submitted a resource task after the deadline and received a warning.',
    status: 'warning',
    staff_comment: 'Improvement already noted after follow-up with class teacher.',
    created_at: '2026-03-14T08:00:00.000Z',
    updated_at: '2026-03-15T08:00:00.000Z',
  },
]

const seededActivityLogs: ActivityLog[] = [
  {
    id: 'activity-1',
    action: 'marks_upload',
    actor_uid: 'usr-3',
    actor_name: 'Eric Habimana',
    actor_role: 'Teacher',
    target_type: 'student_marks',
    target_id: 'mark-1',
    summary: 'Uploaded mathematics marks for Senior 5 Science A.',
    created_at: '2026-03-15T08:05:00.000Z',
  },
  {
    id: 'activity-2',
    action: 'resource_publish',
    actor_uid: 'usr-2',
    actor_name: 'Jane Mukamana',
    actor_role: 'Headmaster',
    target_type: 'learning_resources',
    target_id: 'resource-2',
    summary: 'Published mechanics holiday package for Senior 5 Science A.',
    created_at: '2026-03-13T08:05:00.000Z',
  },
]

const seededClassStudents: ClassStudent[] = [
  { id: 'class-student-1', class_id: 'class-1', student_id: 'student-1' },
  { id: 'class-student-2', class_id: 'class-1', student_id: 'student-2' },
  { id: 'class-student-3', class_id: 'class-2', student_id: 'student-2' },
]

const seededClassPosts: ClassPost[] = [
  {
    id: 'class-post-1',
    class_id: 'class-1',
    posted_by: 'usr-3',
    type: 'lesson',
    title: 'Introduction to Cell Biology',
    content: 'Read chapter 2 and prepare notes on cell structure.',
    attachments: ['biology_chapter_2.pdf'],
    created_at: '2026-03-09T09:00:00.000Z',
  },
  {
    id: 'class-post-2',
    class_id: 'class-1',
    posted_by: 'usr-3',
    type: 'assignment',
    title: 'Physics Holiday Work',
    content: 'Solve the ten mechanics problems in the worksheet.',
    attachments: ['mechanics_holiday_work.pdf'],
    created_at: '2026-03-10T09:00:00.000Z',
  },
  {
    id: 'class-post-3',
    class_id: 'class-2',
    posted_by: 'usr-2',
    type: 'announcement',
    title: 'Class Meeting Reminder',
    content: 'All class representatives should attend the Friday planning meeting.',
    attachments: [],
    created_at: '2026-03-11T09:00:00.000Z',
  },
]

const seededInvites: Invite[] = invites

const toAccessProfileDoc = (user: SystemUser) => ({
  email: user.email,
  displayName: user.fullName,
  fullName: user.fullName,
  role: user.role,
  permissions: user.permissions,
  status: user.status,
  department: user.department,
  isGhost: user.isGhost || false,
  isProtected: user.isProtected || false,
})

export async function fetchAccessProfileUsers({
  isSuperAdminViewer = false,
}: {
  isSuperAdminViewer?: boolean
} = {}): Promise<SystemUser[]> {
  const accessProfilesQuery = isSuperAdminViewer
    ? collection(db, 'access_profiles')
    : query(collection(db, 'access_profiles'), where('isProtected', '==', false))

  const snapshot = await getDocs(accessProfilesQuery)
  return snapshot.docs.map((entry) => {
    const data = entry.data() as Partial<SystemUser> & {
      displayName?: string
      role?: SystemUser['role']
      permissions?: SystemUser['permissions']
    }

    return {
      id: entry.id,
      fullName: data.fullName || data.displayName || 'Unknown User',
      email: data.email || 'unknown@email.com',
      role: data.role || 'Guest',
      permissions: Array.isArray(data.permissions) ? data.permissions : rolePermissions[data.role || 'Guest'],
      status: data.status || 'active',
      department: data.department || 'General',
      isGhost: Boolean((data as { isGhost?: boolean }).isGhost),
      isProtected: Boolean((data as { isProtected?: boolean }).isProtected),
    }
  })
}

export async function seedFirestoreData(currentUser: User | null) {
  const batch = writeBatch(db)

  systemUsers.forEach((user) => {
    batch.set(doc(db, 'access_profiles', user.id), toAccessProfileDoc(user), { merge: true })
  })

  if (currentUser) {
    const matchingSeedUser = systemUsers.find((item) => item.email.toLowerCase() === (currentUser.email || '').toLowerCase())
    batch.set(
      doc(db, 'access_profiles', currentUser.uid),
      matchingSeedUser
        ? toAccessProfileDoc(matchingSeedUser)
        : {
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Signed In User',
            fullName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Signed In User',
            role: 'SuperAdmin',
            permissions: rolePermissions.SuperAdmin,
            status: 'active',
            department: 'Digital Operations',
            isGhost: true,
            isProtected: true,
          },
      { merge: true }
    )
  }

  seededStudents.forEach((student) => batch.set(doc(db, 'students', student.id), student, { merge: true }))
  seededApplications.forEach((application) => batch.set(doc(db, 'applications', application.id), application, { merge: true }))
  seededEvents.forEach((event) => batch.set(doc(db, 'events', event.id), event, { merge: true }))
  seededDonations.forEach((donation) => batch.set(doc(db, 'donations', donation.id), donation, { merge: true }))
  seededBoardMembers.forEach((member) => batch.set(doc(db, 'board_members', member.id), member, { merge: true }))
  seededInvites.forEach((invite) => batch.set(doc(db, 'invites', invite.id), invite, { merge: true }))
  seededClasses.forEach((classroom) => batch.set(doc(db, 'classes', classroom.id), classroom, { merge: true }))
  seededClassStudents.forEach((classStudent) => batch.set(doc(db, 'class_students', classStudent.id), classStudent, { merge: true }))
  seededClassPosts.forEach((classPost) => batch.set(doc(db, 'class_posts', classPost.id), classPost, { merge: true }))
  seededSubjects.forEach((subject) => batch.set(doc(db, 'subjects', subject.id), subject, { merge: true }))
  seededTeacherAssignments.forEach((assignment) => batch.set(doc(db, 'class_teacher_assignments', assignment.id), assignment, { merge: true }))
  seededLearningResources.forEach((resource) => batch.set(doc(db, 'learning_resources', resource.id), resource, { merge: true }))
  seededStudentMarks.forEach((mark) => batch.set(doc(db, 'student_marks', mark.id), mark, { merge: true }))
  seededMarkComments.forEach((comment) => batch.set(doc(db, 'mark_comments', comment.id), comment, { merge: true }))
  seededChatThreads.forEach((thread) => batch.set(doc(db, 'chat_threads', thread.id), thread, { merge: true }))
  seededChatMessages.forEach((message) => batch.set(doc(db, 'chat_messages', message.id), message, { merge: true }))
  seededDisciplineCases.forEach((caseItem) => batch.set(doc(db, 'discipline_cases', caseItem.id), caseItem, { merge: true }))
  seededActivityLogs.forEach((log) => batch.set(doc(db, 'activity_logs', log.id), log, { merge: true }))

  await batch.commit()

  return {
    accessProfiles: systemUsers.length + (currentUser ? 1 : 0),
    students: seededStudents.length,
    applications: seededApplications.length,
    events: seededEvents.length,
    donations: seededDonations.length,
    boardMembers: seededBoardMembers.length,
    invites: seededInvites.length,
    classes: seededClasses.length,
    classStudents: seededClassStudents.length,
    classPosts: seededClassPosts.length,
    subjects: seededSubjects.length,
    classTeacherAssignments: seededTeacherAssignments.length,
    learningResources: seededLearningResources.length,
    studentMarks: seededStudentMarks.length,
    markComments: seededMarkComments.length,
    chatThreads: seededChatThreads.length,
    chatMessages: seededChatMessages.length,
    disciplineCases: seededDisciplineCases.length,
    activityLogs: seededActivityLogs.length,
  }
}

export async function findAccessProfileByEmail(email: string) {
  const snapshot = await getDocs(query(collection(db, 'access_profiles'), where('email', '==', email)))
  const first = snapshot.docs[0]
  return first ? first.data() : null
}
