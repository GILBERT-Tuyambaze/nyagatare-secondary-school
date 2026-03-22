import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore'
import { db } from '../firebase'
import {
  ActivityLog,
  Application,
  BoardMember,
  ChatMessage,
  ChatThread,
  ClassTeacherAssignment,
  ContentMediaItem,
  ContentPost,
  DisciplineCase,
  Donation,
  Event,
  LearningResource,
  MarkComment,
  NewsletterSubscriber,
  PublicAiAssistantSettings,
  PublicAiConversationSummary,
  SchoolSubject,
  SchoolDayStructure,
  Student,
  StudentMark,
  TeacherTimetableSetting,
  TimetableDraft,
  TimetableEntry,
  TimetableSubjectRequirement,
} from '../types/database'
import { ClassPost, Classroom, ClassStudent, Invite, ParentRelationshipType, Role, SystemUser } from '../loginpage/types'
import { rolePermissions } from '../loginpage/lib/rbac'

type FirestoreEntity = {
  id: string
  created_at?: string
  updated_at?: string
}

const nowIso = () => new Date().toISOString()

const createInviteToken = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const withId = <T extends Record<string, unknown>>(id: string, data: T | undefined): T & { id: string } => ({
  id,
  ...(data ?? {}),
}) as T & { id: string }

const removeUndefined = <T extends Record<string, unknown>>(value: T): T =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T

const sortByString = <T>(items: T[], accessor: (item: T) => string) =>
  [...items].sort((left, right) => accessor(left).localeCompare(accessor(right)))

const parentRelationshipTypes: ParentRelationshipType[] = ['mother', 'father', 'relative']
const MAX_PARENT_LINKS_PER_STUDENT = 3
const MAX_STUDENTS_PER_PARENT = 6

const generateApplicationId = () => {
  const stamp = Date.now().toString().slice(-6)
  const year = new Date().getFullYear()
  return `APP-${year}-${stamp}`
}

const applicationsCollection = collection(db, 'applications')
const eventsCollection = collection(db, 'events')
const donationsCollection = collection(db, 'donations')
const boardMembersCollection = collection(db, 'board_members')
const studentsCollection = collection(db, 'students')
const accessProfilesCollection = collection(db, 'access_profiles')
const invitesCollection = collection(db, 'invites')
const contentPostsCollection = collection(db, 'content_posts')
const subjectsCollection = collection(db, 'subjects')
const classTeacherAssignmentsCollection = collection(db, 'class_teacher_assignments')
const learningResourcesCollection = collection(db, 'learning_resources')
const studentMarksCollection = collection(db, 'student_marks')
const markCommentsCollection = collection(db, 'mark_comments')
const chatThreadsCollection = collection(db, 'chat_threads')
const chatMessagesCollection = collection(db, 'chat_messages')
const disciplineCasesCollection = collection(db, 'discipline_cases')
const activityLogsCollection = collection(db, 'activity_logs')
const classesCollection = collection(db, 'classes')
const classStudentsCollection = collection(db, 'class_students')
const classPostsCollection = collection(db, 'class_posts')
const systemSettingsCollection = collection(db, 'system_settings')
const newsletterSubscribersCollection = collection(db, 'newsletter_subscribers')
const publicAiConversationsCollection = collection(db, 'public_ai_conversations')
const schoolDayStructuresCollection = collection(db, 'school_day_structures')
const timetableSubjectRequirementsCollection = collection(db, 'timetable_subject_requirements')
const teacherTimetableSettingsCollection = collection(db, 'teacher_timetable_settings')
const timetableEntriesCollection = collection(db, 'timetable_entries')
const timetableDraftsCollection = collection(db, 'timetable_drafts')
const newsletterSourceLabels = {
  footer: 'Homepage Footer',
  events: 'Events Page',
} as const

const mockBoardMembers: BoardMember[] = [
  {
    id: '1',
    full_name: 'Dr. Jean Baptiste Nzeyimana',
    position: 'Head of Science Department',
    category: 'teacher',
    bio: 'Dr. Nzeyimana has been teaching physics and mathematics for over 15 years. He holds a PhD in Physics from the University of Rwanda and is passionate about STEM education.',
    email: 'j.nzeyimana@nyagataress.edu.rw',
    phone: '+250 788 100 001',
    qualifications: 'PhD in Physics, MSc in Mathematics Education',
    experience_years: 15,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    full_name: 'Mrs. Grace Mukamana',
    position: 'English Language Coordinator',
    category: 'teacher',
    bio: 'Mrs. Mukamana specializes in English literature and language instruction. She has developed innovative teaching methods that have significantly improved student performance.',
    email: 'g.mukamana@nyagataress.edu.rw',
    phone: '+250 788 100 002',
    qualifications: 'MA in English Literature, TESOL Certification',
    experience_years: 12,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '3',
    full_name: 'Mr. Paul Uwimana',
    position: 'School Principal',
    category: 'leader',
    bio: 'Mr. Uwimana has been leading Nyagatare Secondary School for the past 8 years. Under his leadership, the school has achieved remarkable academic excellence and infrastructure development.',
    email: 'p.uwimana@nyagataress.edu.rw',
    phone: '+250 788 100 003',
    qualifications: 'MEd in Educational Leadership, BA in Education',
    experience_years: 20,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '4',
    full_name: 'Mr. Charles Habimana',
    position: 'Parent Board Chairman',
    category: 'parent',
    bio: 'Mr. Habimana represents the parent community and works closely with the school administration to ensure student welfare and academic success.',
    email: 'c.habimana@email.com',
    phone: '+250 788 100 005',
    qualifications: 'MBA in Business Administration',
    experience_years: 5,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
]

const mockDashboardStats = {
  totalApplications: 148,
  pendingApplications: 23,
  totalStudents: 456,
  upcomingEvents: 8,
  totalDonations: 12450,
  totalBoardMembers: 12,
  applicationsByStatus: {
    pending: 23,
    review: 15,
    admitted: 89,
    rejected: 12,
    waitlist: 9,
  },
}

const mockContentPosts: ContentPost[] = [
  {
    id: 'content-1',
    title: 'STEM Fair 2026 Launch',
    slug: 'stem-fair-2026-launch',
    type: 'news',
    status: 'published',
    excerpt: 'Our student innovators are preparing a flagship STEM showcase for the new academic year.',
    body: 'Nyagatare Secondary School is opening the STEM Fair 2026 season with new robotics, engineering, and software design tracks led by our best tech students.',
    author_name: 'NSS Communications',
    published_at: '2026-03-18T09:00:00.000Z',
    created_at: '2026-03-18T09:00:00.000Z',
    updated_at: '2026-03-18T09:00:00.000Z',
  },
  {
    id: 'content-2',
    title: 'Parent Leadership Forum',
    slug: 'parent-leadership-forum',
    type: 'announcement',
    status: 'review',
    excerpt: 'Leadership and parent representatives are aligning on term priorities and student wellbeing.',
    body: 'The upcoming parent leadership forum will bring together school leaders, class representatives, and digital communication coordinators.',
    author_name: 'Governance Office',
    created_at: '2026-03-17T12:30:00.000Z',
    updated_at: '2026-03-19T08:15:00.000Z',
  },
  {
    id: 'content-3',
    title: 'How NSS Builds Future Tech Leaders',
    slug: 'how-nss-builds-future-tech-leaders',
    type: 'blog',
    status: 'draft',
    excerpt: 'A closer look at the school culture, digital systems, and mentoring behind our strongest technology students.',
    body: 'Nyagatare Secondary School continues to invest in practical problem solving, peer mentorship, and digital fluency so students graduate ready to lead in technology-rich environments.',
    author_name: 'Digital Learning Desk',
    created_at: '2026-03-16T14:45:00.000Z',
    updated_at: '2026-03-20T10:20:00.000Z',
  },
]

// Applications
export const getApplications = async () => {
  try {
    const snapshot = await getDocs(query(applicationsCollection, orderBy('created_at', 'desc')))
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as Application[]
  } catch (error) {
    console.error('Error fetching applications:', error)
    return []
  }
}

export const getApplicationById = async (id: string) => {
  try {
    const snapshot = await getDoc(doc(applicationsCollection, id))
    if (!snapshot.exists()) return null
    return withId(snapshot.id, snapshot.data()) as Application
  } catch (error) {
    console.error('Error fetching application:', error)
    return null
  }
}

export const getApplicationByApplicationId = async (applicationId: string) => {
  try {
    const snapshot = await getDocs(query(applicationsCollection, where('application_id', '==', applicationId)))
    const first = snapshot.docs[0]
    if (!first) return null
    return withId(first.id, first.data()) as Application
  } catch (error) {
    console.error('Error fetching application:', error)
    return null
  }
}

export const createApplication = async (
  application: Omit<Application, 'id' | 'application_id' | 'created_at' | 'updated_at'>
) => {
  try {
    const created_at = nowIso()
    const document = {
      ...application,
      application_id: generateApplicationId(),
      created_at,
      updated_at: created_at,
    }
    const ref = await addDoc(applicationsCollection, document)
    return withId(ref.id, document) as Application
  } catch (error) {
    console.error('Error creating application:', error)
    throw error
  }
}

export const submitPublicApplication = async ({
  origin,
  application,
}: {
  origin: string
  application: Omit<Application, 'id' | 'application_id' | 'created_at' | 'updated_at'>
}) => {
  const settings = await getApplicationsSettings()
  if (settings.isOpen === false) {
    throw new Error('Applications are currently closed. Please try again later.')
  }

  const created_at = nowIso()
  const application_id = generateApplicationId()
  const normalizedEmail = application.email?.trim().toLowerCase() || ''

  let applicantInviteId: string | undefined
  let applicantSignupUrl: string | undefined

  if (normalizedEmail) {
    const invite = await createApplicantInvite({
      applicationId: application_id,
      email: normalizedEmail,
      origin,
    })

    applicantInviteId = invite.id
    applicantSignupUrl = invite.signupUrl
  }

  const document = removeUndefined({
    ...application,
    email: normalizedEmail || undefined,
    application_id,
    applicant_invite_id: applicantInviteId,
    applicant_signup_url: applicantSignupUrl,
    created_at,
    updated_at: created_at,
  })

  const ref = await addDoc(applicationsCollection, document)
  return withId(ref.id, document) as Application
}

export const updateApplication = async (id: string, updates: Partial<Application>) => {
  try {
    const documentRef = doc(applicationsCollection, id)
    const payload = removeUndefined({
      ...updates,
      updated_at: nowIso(),
    })
    await updateDoc(documentRef, payload)
    const snapshot = await getDoc(documentRef)
    return withId(snapshot.id, snapshot.data()) as Application
  } catch (error) {
    console.error('Error updating application:', error)
    throw error
  }
}

export const deleteApplication = async (id: string) => {
  try {
    await deleteDoc(doc(applicationsCollection, id))
  } catch (error) {
    console.error('Error deleting application:', error)
    throw error
  }
}

// Events
export const getEvents = async () => {
  try {
    const snapshot = await getDocs(query(eventsCollection, orderBy('event_date', 'asc')))
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as Event[]
  } catch (error) {
    console.error('Error fetching events:', error)
    return []
  }
}

export const createEvent = async (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const created_at = nowIso()
    const document = {
      ...event,
      created_at,
      updated_at: created_at,
    }
    const ref = await addDoc(eventsCollection, document)
    return withId(ref.id, document) as Event
  } catch (error) {
    console.error('Error creating event:', error)
    throw error
  }
}

export const updateEvent = async (id: string, updates: Partial<Event>) => {
  try {
    const documentRef = doc(eventsCollection, id)
    await updateDoc(
      documentRef,
      removeUndefined({
        ...updates,
        updated_at: nowIso(),
      })
    )
    const snapshot = await getDoc(documentRef)
    return withId(snapshot.id, snapshot.data()) as Event
  } catch (error) {
    console.error('Error updating event:', error)
    throw error
  }
}

export const deleteEvent = async (id: string) => {
  try {
    await deleteDoc(doc(eventsCollection, id))
  } catch (error) {
    console.error('Error deleting event:', error)
    throw error
  }
}

// Content posts
export const getContentPosts = async () => {
  try {
    const snapshot = await getDocs(query(contentPostsCollection, orderBy('updated_at', 'desc')))
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as ContentPost[]
  } catch (error) {
    console.error('Error fetching content posts:', error)
    return mockContentPosts
  }
}

export const createContentPost = async (post: Omit<ContentPost, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const created_at = nowIso()
    const document = {
      ...post,
      created_at,
      updated_at: created_at,
    }
    const ref = await addDoc(contentPostsCollection, document)
    return withId(ref.id, document) as ContentPost
  } catch (error) {
    console.error('Error creating content post:', error)
    throw error
  }
}

export const updateContentPost = async (id: string, updates: Partial<ContentPost>) => {
  try {
    const documentRef = doc(contentPostsCollection, id)
    await updateDoc(
      documentRef,
      removeUndefined({
        ...updates,
        updated_at: nowIso(),
      })
    )
    const snapshot = await getDoc(documentRef)
    return withId(snapshot.id, snapshot.data()) as ContentPost
  } catch (error) {
    console.error('Error updating content post:', error)
    throw error
  }
}

export const deleteContentPost = async (id: string) => {
  try {
    await deleteDoc(doc(contentPostsCollection, id))
  } catch (error) {
    console.error('Error deleting content post:', error)
    throw error
  }
}

// Class and learning system
export const getSubjects = async () => {
  try {
    const snapshot = await getDocs(query(subjectsCollection, orderBy('name', 'asc')))
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as SchoolSubject[]
  } catch (error) {
    console.error('Error fetching subjects:', error)
    return []
  }
}

export const getSchoolDayStructures = async () => {
  try {
    const snapshot = await getDocs(query(schoolDayStructuresCollection, orderBy('updated_at', 'desc')))
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as SchoolDayStructure[]
  } catch (error) {
    console.error('Error fetching school day structures:', error)
    return []
  }
}

export const upsertSchoolDayStructure = async (
  id: string | null,
  structure: Omit<SchoolDayStructure, 'id' | 'created_at' | 'updated_at'>
) => {
  const created_at = nowIso()
  const payload = {
    ...structure,
    updated_at: created_at,
  }

  try {
    if (id) {
      const documentRef = doc(schoolDayStructuresCollection, id)
      const existing = await getDoc(documentRef)
      await setDoc(
        documentRef,
        removeUndefined({
          ...payload,
          created_at: existing.data()?.created_at || created_at,
        }),
        { merge: true }
      )
      const snapshot = await getDoc(documentRef)
      return withId(snapshot.id, snapshot.data()) as SchoolDayStructure
    }

    const ref = await addDoc(schoolDayStructuresCollection, {
      ...payload,
      created_at,
    })
    const snapshot = await getDoc(ref)
    return withId(snapshot.id, snapshot.data()) as SchoolDayStructure
  } catch (error) {
    console.error('Error saving school day structure:', error)
    throw error
  }
}

export const getTimetableSubjectRequirements = async () => {
  try {
    const snapshot = await getDocs(query(timetableSubjectRequirementsCollection, orderBy('updated_at', 'desc')))
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as TimetableSubjectRequirement[]
  } catch (error) {
    console.error('Error fetching timetable subject requirements:', error)
    return []
  }
}

export const createTimetableSubjectRequirement = async (
  requirement: Omit<TimetableSubjectRequirement, 'id' | 'created_at' | 'updated_at'>
) => {
  try {
    const created_at = nowIso()
    const document = {
      ...requirement,
      created_at,
      updated_at: created_at,
    }
    const ref = await addDoc(timetableSubjectRequirementsCollection, document)
    return withId(ref.id, document) as TimetableSubjectRequirement
  } catch (error) {
    console.error('Error creating timetable subject requirement:', error)
    throw error
  }
}

export const updateTimetableSubjectRequirement = async (
  id: string,
  updates: Partial<TimetableSubjectRequirement>
) => {
  try {
    const documentRef = doc(timetableSubjectRequirementsCollection, id)
    await updateDoc(
      documentRef,
      removeUndefined({
        ...updates,
        updated_at: nowIso(),
      })
    )
    const snapshot = await getDoc(documentRef)
    return withId(snapshot.id, snapshot.data()) as TimetableSubjectRequirement
  } catch (error) {
    console.error('Error updating timetable subject requirement:', error)
    throw error
  }
}

export const deleteTimetableSubjectRequirement = async (id: string) => {
  try {
    await deleteDoc(doc(timetableSubjectRequirementsCollection, id))
  } catch (error) {
    console.error('Error deleting timetable subject requirement:', error)
    throw error
  }
}

export const getTeacherTimetableSettings = async () => {
  try {
    const snapshot = await getDocs(query(teacherTimetableSettingsCollection, orderBy('teacher_name', 'asc')))
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as TeacherTimetableSetting[]
  } catch (error) {
    console.error('Error fetching teacher timetable settings:', error)
    return []
  }
}

export const upsertTeacherTimetableSetting = async (
  id: string | null,
  setting: Omit<TeacherTimetableSetting, 'id' | 'created_at' | 'updated_at'>
) => {
  const created_at = nowIso()
  const payload = {
    ...setting,
    updated_at: created_at,
  }

  try {
    if (id) {
      const documentRef = doc(teacherTimetableSettingsCollection, id)
      const existing = await getDoc(documentRef)
      await setDoc(
        documentRef,
        removeUndefined({
          ...payload,
          created_at: existing.data()?.created_at || created_at,
        }),
        { merge: true }
      )
      const snapshot = await getDoc(documentRef)
      return withId(snapshot.id, snapshot.data()) as TeacherTimetableSetting
    }

    const ref = await addDoc(teacherTimetableSettingsCollection, {
      ...payload,
      created_at,
    })
    const snapshot = await getDoc(ref)
    return withId(snapshot.id, snapshot.data()) as TeacherTimetableSetting
  } catch (error) {
    console.error('Error saving teacher timetable setting:', error)
    throw error
  }
}

export const getTimetableEntries = async () => {
  try {
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const snapshot = await getDocs(timetableEntriesCollection)
    return snapshot.docs
      .map((entry) => withId(entry.id, entry.data()) as TimetableEntry)
      .sort((left, right) => {
        const dayDifference = dayOrder.indexOf(left.day) - dayOrder.indexOf(right.day)
        if (dayDifference !== 0) return dayDifference
        return left.period_number - right.period_number
      })
  } catch (error) {
    console.error('Error fetching timetable entries:', error)
    return []
  }
}

export const replaceTimetableEntries = async (
  filters: { academic_year: string; term: string },
  entries: Array<Omit<TimetableEntry, 'id' | 'created_at' | 'updated_at'>>
) => {
  try {
    const existing = await getDocs(
      query(
        timetableEntriesCollection,
        where('academic_year', '==', filters.academic_year),
        where('term', '==', filters.term)
      )
    )

    await Promise.all(existing.docs.map((entry) => deleteDoc(entry.ref)))

    const created_at = nowIso()
    const saved = await Promise.all(
      entries.map(async (entry) => {
        const document = {
          ...entry,
          created_at,
          updated_at: created_at,
        }
        const ref = await addDoc(timetableEntriesCollection, document)
        return withId(ref.id, document) as TimetableEntry
      })
    )

    return saved
  } catch (error) {
    console.error('Error replacing timetable entries:', error)
    throw error
  }
}

const buildTimetableDraftId = (academicYear: string, term: string) =>
  `${academicYear.trim().replace(/\s+/g, '_')}__${term.trim().replace(/\s+/g, '_')}`

export const getTimetableDrafts = async () => {
  try {
    const snapshot = await getDocs(query(timetableDraftsCollection, orderBy('updated_at', 'desc')))
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as TimetableDraft[]
  } catch (error) {
    console.error('Error fetching timetable drafts:', error)
    return []
  }
}

export const upsertTimetableDraft = async (
  payload: Omit<TimetableDraft, 'id' | 'created_at' | 'updated_at'>
) => {
  try {
    const id = buildTimetableDraftId(payload.academic_year, payload.term)
    const documentRef = doc(timetableDraftsCollection, id)
    const existing = await getDoc(documentRef)
    const created_at = existing.exists() ? existing.data()?.created_at || nowIso() : nowIso()
    const updated_at = nowIso()
    const document = removeUndefined({
      ...payload,
      created_at,
      updated_at,
    })

    await setDoc(documentRef, document, { merge: true })
    const snapshot = await getDoc(documentRef)
    return withId(snapshot.id, snapshot.data()) as TimetableDraft
  } catch (error) {
    console.error('Error saving timetable draft:', error)
    throw error
  }
}

export const getClassTeacherAssignments = async () => {
  try {
    const snapshot = await getDocs(query(classTeacherAssignmentsCollection, orderBy('created_at', 'desc')))
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as ClassTeacherAssignment[]
  } catch (error) {
    console.error('Error fetching class teacher assignments:', error)
    return []
  }
}

export const createLearningResource = async (resource: Omit<LearningResource, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const created_at = nowIso()
    const document = {
      ...resource,
      created_at,
      updated_at: created_at,
    }
    const ref = await addDoc(learningResourcesCollection, document)
    return withId(ref.id, document) as LearningResource
  } catch (error) {
    console.error('Error creating learning resource:', error)
    throw error
  }
}

export const getLearningResources = async () => {
  try {
    const snapshot = await getDocs(query(learningResourcesCollection, orderBy('created_at', 'desc')))
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as LearningResource[]
  } catch (error) {
    console.error('Error fetching learning resources:', error)
    return []
  }
}

export const createStudentMark = async (mark: Omit<StudentMark, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const created_at = nowIso()
    const document = {
      ...mark,
      created_at,
      updated_at: created_at,
    }
    const ref = await addDoc(studentMarksCollection, document)
    return withId(ref.id, document) as StudentMark
  } catch (error) {
    console.error('Error creating student mark:', error)
    throw error
  }
}

export const updateStudentMark = async (id: string, updates: Partial<StudentMark>) => {
  try {
    const documentRef = doc(studentMarksCollection, id)
    await updateDoc(
      documentRef,
      removeUndefined({
        ...updates,
        updated_at: nowIso(),
      })
    )
    const snapshot = await getDoc(documentRef)
    return withId(snapshot.id, snapshot.data()) as StudentMark
  } catch (error) {
    console.error('Error updating student mark:', error)
    throw error
  }
}

export const getStudentMarks = async () => {
  try {
    const snapshot = await getDocs(query(studentMarksCollection, orderBy('created_at', 'desc')))
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as StudentMark[]
  } catch (error) {
    console.error('Error fetching student marks:', error)
    return []
  }
}

export const addMarkComment = async (comment: Omit<MarkComment, 'id' | 'created_at'>) => {
  try {
    const created_at = nowIso()
    const document = {
      ...comment,
      created_at,
    }
    const ref = await addDoc(markCommentsCollection, document)
    return withId(ref.id, document) as MarkComment
  } catch (error) {
    console.error('Error creating mark comment:', error)
    throw error
  }
}

export const getMarkComments = async () => {
  try {
    const snapshot = await getDocs(query(markCommentsCollection, orderBy('created_at', 'desc')))
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as MarkComment[]
  } catch (error) {
    console.error('Error fetching mark comments:', error)
    return []
  }
}

export const getChatThreads = async () => {
  try {
    const snapshot = await getDocs(query(chatThreadsCollection, orderBy('updated_at', 'desc')))
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as ChatThread[]
  } catch (error) {
    console.error('Error fetching chat threads:', error)
    return []
  }
}

export const createChatThread = async (thread: Omit<ChatThread, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const created_at = nowIso()
    const document = {
      ...thread,
      created_at,
      updated_at: created_at,
    }
    const ref = await addDoc(chatThreadsCollection, document)
    return withId(ref.id, document) as ChatThread
  } catch (error) {
    console.error('Error creating chat thread:', error)
    throw error
  }
}

export const getOrCreatePrivateSubjectThread = async ({
  classId,
  subjectId,
  subjectName,
  studentId,
  studentName,
  teacherUserId,
  teacherName,
}: {
  classId: string
  subjectId: string
  subjectName: string
  studentId: string
  studentName: string
  teacherUserId: string
  teacherName: string
}) => {
  try {
    const snapshot = await getDocs(
      query(
        chatThreadsCollection,
        where('class_id', '==', classId),
        where('type', '==', 'private_subject'),
        where('subject_id', '==', subjectId),
        where('student_id', '==', studentId),
        where('teacher_user_id', '==', teacherUserId)
      )
    )

    const existing = snapshot.docs[0]
    if (existing) {
      return withId(existing.id, existing.data()) as ChatThread
    }

    return await createChatThread({
      class_id: classId,
      type: 'private_subject',
      title: `${studentName} and ${teacherName}`,
      subject_id: subjectId,
      subject_name: subjectName,
      student_id: studentId,
      teacher_user_id: teacherUserId,
    })
  } catch (error) {
    console.error('Error creating private subject thread:', error)
    throw error
  }
}

export const createChatMessage = async (message: Omit<ChatMessage, 'id' | 'created_at'>) => {
  try {
    const created_at = nowIso()
    const document = {
      ...message,
      created_at,
    }
    const ref = await addDoc(chatMessagesCollection, document)

    const threadRef = doc(chatThreadsCollection, message.thread_id)
    await updateDoc(threadRef, { updated_at: created_at })

    return withId(ref.id, document) as ChatMessage
  } catch (error) {
    console.error('Error creating chat message:', error)
    throw error
  }
}

export const getChatMessages = async () => {
  try {
    const snapshot = await getDocs(query(chatMessagesCollection, orderBy('created_at', 'asc')))
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as ChatMessage[]
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return []
  }
}

export const getDisciplineCases = async () => {
  try {
    const snapshot = await getDocs(query(disciplineCasesCollection, orderBy('created_at', 'desc')))
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as DisciplineCase[]
  } catch (error) {
    console.error('Error fetching discipline cases:', error)
    return []
  }
}

export const getActivityLogs = async () => {
  try {
    const snapshot = await getDocs(query(activityLogsCollection, orderBy('created_at', 'desc')))
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as ActivityLog[]
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return []
  }
}

export const logActivity = async (entry: Omit<ActivityLog, 'id' | 'created_at'>) => {
  try {
    const created_at = nowIso()
    const document = {
      ...entry,
      created_at,
    }
    const ref = await addDoc(activityLogsCollection, document)
    return withId(ref.id, document) as ActivityLog
  } catch (error) {
    console.error('Error logging activity:', error)
    throw error
  }
}

// Donations
export const getDonations = async () => {
  try {
    const snapshot = await getDocs(query(donationsCollection, orderBy('created_at', 'desc')))
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as Donation[]
  } catch (error) {
    console.error('Error fetching donations:', error)
    return []
  }
}

export const createDonation = async (donation: Omit<Donation, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const created_at = nowIso()
    const document = removeUndefined({
      ...donation,
      donor_name: donation.is_anonymous ? 'Anonymous donor' : donation.donor_name.trim(),
      donor_email: donation.donor_email?.trim().toLowerCase() || undefined,
      donor_phone: donation.donor_phone?.trim() || undefined,
      payment_method: donation.payment_method?.trim() || undefined,
      payment_provider: donation.payment_provider || undefined,
      payment_link: donation.payment_link || undefined,
      payment_reference: donation.payment_reference?.trim() || undefined,
      receipt_url: donation.receipt_url?.trim() || undefined,
      receipt_path: donation.receipt_path?.trim() || undefined,
      message: donation.message?.trim() || undefined,
      created_at,
      updated_at: created_at,
    })
    const ref = await addDoc(donationsCollection, document)
    return withId(ref.id, document) as Donation
  } catch (error) {
    console.error('Error creating donation:', error)
    throw error
  }
}

export const updateDonation = async (id: string, updates: Partial<Donation>) => {
  try {
    const documentRef = doc(donationsCollection, id)
    await updateDoc(
      documentRef,
      removeUndefined({
        ...updates,
        donor_name: updates.donor_name?.trim(),
        donor_email: updates.donor_email?.trim().toLowerCase() || undefined,
        donor_phone: updates.donor_phone?.trim() || undefined,
        payment_method: updates.payment_method?.trim() || undefined,
        payment_provider: updates.payment_provider || undefined,
        payment_link: updates.payment_link || undefined,
        payment_reference: updates.payment_reference?.trim() || undefined,
        receipt_url: updates.receipt_url?.trim() || undefined,
        receipt_path: updates.receipt_path?.trim() || undefined,
        message: updates.message?.trim() || undefined,
        updated_at: nowIso(),
      })
    )
    const snapshot = await getDoc(documentRef)
    return withId(snapshot.id, snapshot.data()) as Donation
  } catch (error) {
    console.error('Error updating donation:', error)
    throw error
  }
}

export const deleteDonation = async (id: string) => {
  try {
    await deleteDoc(doc(donationsCollection, id))
  } catch (error) {
    console.error('Error deleting donation:', error)
    throw error
  }
}

// Board Members
export const getBoardMembers = async () => {
  try {
    const snapshot = await getDocs(query(boardMembersCollection, where('is_active', '==', true)))
    const members = snapshot.docs.map((entry) => withId(entry.id, entry.data())) as BoardMember[]
    return sortByString(sortByString(members, (member) => member.full_name), (member) => member.category)
  } catch (error) {
    console.error('Error fetching board members:', error)
    return mockBoardMembers
  }
}

export const getAllBoardMembers = async () => {
  try {
    const snapshot = await getDocs(query(boardMembersCollection, orderBy('full_name', 'asc')))
    const members = snapshot.docs.map((entry) => withId(entry.id, entry.data())) as BoardMember[]
    return sortByString(sortByString(members, (member) => member.full_name), (member) => member.category)
  } catch (error) {
    console.error('Error fetching all board members:', error)
    return mockBoardMembers
  }
}

export const createBoardMember = async (member: Omit<BoardMember, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const ref = doc(boardMembersCollection)
    const created_at = nowIso()
    const document = {
      ...member,
      id: ref.id,
      created_at,
      updated_at: created_at,
    }
    await setDoc(ref, document)
    return document as BoardMember
  } catch (error) {
    console.error('Error creating board member:', error)
    throw error
  }
}

export const updateBoardMember = async (id: string, updates: Partial<BoardMember>) => {
  try {
    const documentRef = doc(boardMembersCollection, id)
    await updateDoc(
      documentRef,
      removeUndefined({
        ...updates,
        updated_at: nowIso(),
      })
    )
    const snapshot = await getDoc(documentRef)
    return withId(snapshot.id, snapshot.data()) as BoardMember
  } catch (error) {
    console.error('Error updating board member:', error)
    throw error
  }
}

export const deleteBoardMember = async (id: string) => {
  try {
    await deleteDoc(doc(boardMembersCollection, id))
  } catch (error) {
    console.error('Error deleting board member:', error)
    throw error
  }
}

// Students
export const getStudents = async () => {
  try {
    const snapshot = await getDocs(query(studentsCollection, orderBy('created_at', 'desc')))
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as Student[]
  } catch (error) {
    console.error('Error fetching students:', error)
    return []
  }
}

export const getAccessProfiles = async () => {
  try {
    const snapshot = await getDocs(accessProfilesCollection)
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as SystemUser[]
  } catch (error) {
    console.error('Error fetching access profiles:', error)
    return []
  }
}

export const getAccessProfileById = async (id: string) => {
  try {
    const snapshot = await getDoc(doc(accessProfilesCollection, id))
    if (!snapshot.exists()) return null
    return withId(snapshot.id, snapshot.data()) as SystemUser
  } catch (error) {
    console.error('Error fetching access profile by id:', error)
    return null
  }
}

export const updateAccessProfileRecord = async (id: string, updates: Partial<SystemUser> & Record<string, unknown>) => {
  try {
    const documentRef = doc(accessProfilesCollection, id)
    await setDoc(documentRef, removeUndefined(updates), { merge: true })
    const snapshot = await getDoc(documentRef)
    return snapshot.exists() ? (withId(snapshot.id, snapshot.data()) as SystemUser) : null
  } catch (error) {
    console.error('Error updating access profile:', error)
    throw error
  }
}

export const deleteAccessProfileRecord = async (id: string) => {
  try {
    await deleteDoc(doc(accessProfilesCollection, id))
  } catch (error) {
    console.error('Error deleting access profile:', error)
    throw error
  }
}

export const getInvites = async () => {
  try {
    const snapshot = await getDocs(query(invitesCollection, orderBy('createdAt', 'desc')))
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as Invite[]
  } catch (error) {
    console.error('Error fetching invites:', error)
    return []
  }
}

export const getInvitesByInviter = async (invitedByUid: string) => {
  try {
    const snapshot = await getDocs(query(invitesCollection, where('invitedByUid', '==', invitedByUid)))
    const inviteData = snapshot.docs.map((entry) => withId(entry.id, entry.data())) as Invite[]
    return sortByString(inviteData, (invite) => invite.createdAt ?? '')
  } catch (error) {
    console.error('Error fetching invites by inviter:', error)
    return []
  }
}

export const getInviteByToken = async (token: string) => {
  try {
    const snapshot = await getDoc(doc(invitesCollection, token))
    if (!snapshot.exists()) return null
    return withId(snapshot.id, snapshot.data()) as Invite
  } catch (error) {
    console.error('Error fetching invite by token:', error)
    return null
  }
}

const getStudentByEmail = async (email: string) => {
  const snapshot = await getDocs(query(studentsCollection, where('email', '==', email)))
  const firstMatch = snapshot.docs[0]
  return firstMatch ? (withId(firstMatch.id, firstMatch.data()) as Student) : null
}

const getInvitesForParenting = async () => {
  const snapshot = await getDocs(invitesCollection)
  return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as Invite[]
}

export const createInvite = async ({
  email,
  role,
  invitedBy,
  invitedByUid,
  invitedByRole,
  origin,
  invitedByEmail,
  relatedStudentId,
  relatedStudentName,
  parentRelationshipType,
}: {
  email: string
  role: Role
  invitedBy: string
  invitedByUid: string
  invitedByRole: Role
  origin: string
  invitedByEmail?: string | null
  relatedStudentId?: string
  relatedStudentName?: string
  parentRelationshipType?: ParentRelationshipType
}) => {
  try {
    if ((role === 'Parent' || role === 'ParentLeader') && !relatedStudentId) {
      throw new Error('Select the student this parent will be linked to.')
    }

    if ((role === 'Parent' || role === 'ParentLeader') && !parentRelationshipType) {
      throw new Error('Select whether this parent is the mother, father, or relative.')
    }

    if (parentRelationshipType && !parentRelationshipTypes.includes(parentRelationshipType)) {
      throw new Error('Invalid parent relationship type.')
    }

    if (invitedByRole === 'Student') {
      if (role !== 'Parent') {
        throw new Error('Students can only invite parent accounts.')
      }

      const inviterEmail = invitedByEmail?.trim().toLowerCase()
      if (!inviterEmail) {
        throw new Error('Student invite requires the student email to be matched.')
      }

      const inviterStudent = await getStudentByEmail(inviterEmail)
      if (!inviterStudent) {
        throw new Error('This student account is not linked to a student record yet.')
      }

      if (relatedStudentId && relatedStudentId !== inviterStudent.id) {
        throw new Error('Students can only invite parents for their own profile.')
      }

      relatedStudentId = inviterStudent.id
      relatedStudentName = `${inviterStudent.first_name} ${inviterStudent.last_name}`
    }

    if (role === 'Parent' || role === 'ParentLeader') {
      const allParentInvites = await getInvitesForParenting()
      const normalizedEmail = email.trim().toLowerCase()
      const studentLinks = allParentInvites.filter(
        (invite) =>
          invite.relatedStudentId === relatedStudentId &&
          ['Parent', 'ParentLeader'].includes(invite.role) &&
          ['pending', 'accepted'].includes(invite.status)
      )

      const usedRelationshipTypes = new Set(
        studentLinks.map((invite) => invite.parentRelationshipType).filter(Boolean) as ParentRelationshipType[]
      )

      if (
        parentRelationshipType &&
        usedRelationshipTypes.has(parentRelationshipType) &&
        !studentLinks.some((invite) => invite.email.toLowerCase() === normalizedEmail)
      ) {
        throw new Error(`This student already has a ${parentRelationshipType} parent linked or invited.`)
      }

      if (
        studentLinks.filter((invite) => invite.email.toLowerCase() !== normalizedEmail).length >=
        MAX_PARENT_LINKS_PER_STUDENT
      ) {
        throw new Error('A student cannot have more than three parent links: mother, father, and relative.')
      }

      const parentInviteStudentIds = new Set(
        allParentInvites
          .filter(
            (invite) =>
              invite.email.toLowerCase() === normalizedEmail &&
              ['Parent', 'ParentLeader'].includes(invite.role) &&
              ['pending', 'accepted'].includes(invite.status) &&
              invite.relatedStudentId
          )
          .map((invite) => invite.relatedStudentId as string)
      )

      const totalStudentIds = new Set([
        ...Array.from(parentInviteStudentIds),
        relatedStudentId as string,
      ])

      if (totalStudentIds.size > MAX_STUDENTS_PER_PARENT) {
        throw new Error('A parent can be linked to up to six students only.')
      }

      const duplicatePendingInvite = allParentInvites.find(
        (invite) =>
          invite.email.toLowerCase() === normalizedEmail &&
          invite.relatedStudentId === relatedStudentId &&
          invite.parentRelationshipType === parentRelationshipType &&
          invite.status === 'pending'
      )

      if (duplicatePendingInvite) {
        throw new Error('This parent already has a pending invitation for that student relationship.')
      }
    }

    const token = createInviteToken()
    const createdAt = nowIso()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const signupUrl = `${origin.replace(/\/$/, '')}/invite-signup/${token}`
    const document = {
      id: token,
      email,
      role,
      invitedBy,
      invitedByUid,
      invitedByRole,
      status: 'pending' as const,
      expiresAt,
      createdAt,
      signupUrl,
      relatedStudentId,
      relatedStudentName,
      parentRelationshipType,
    }

    await setDoc(doc(invitesCollection, token), document)
    return document as Invite
  } catch (error) {
    console.error('Error creating invite:', error)
    throw error
  }
}

export const createApplicantInvite = async ({
  applicationId,
  email,
  origin,
}: {
  applicationId: string
  email: string
  origin: string
}) => {
  const token = createInviteToken()
  const createdAt = nowIso()
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  const signupUrl = `${origin.replace(/\/$/, '')}/invite-signup/${token}`

  const document: Invite = {
    id: token,
    applicationId,
    email,
    role: 'Applicant',
    invitedBy: 'Admissions Portal',
    invitedByUid: 'public-application',
    invitedByRole: 'Applicant',
    status: 'pending',
    expiresAt,
    createdAt,
    signupUrl,
  }

  await setDoc(doc(invitesCollection, token), document)
  return document
}

export const updateInviteRole = async ({
  inviteId,
  role,
}: {
  inviteId: string
  role: Role
}) => {
  const inviteRef = doc(invitesCollection, inviteId)
  await updateDoc(inviteRef, {
    role,
  })

  const updatedSnapshot = await getDoc(inviteRef)
  return withId(updatedSnapshot.id, updatedSnapshot.data()) as Invite
}

export const regenerateInviteLink = async ({
  inviteId,
  origin,
}: {
  inviteId: string
  origin: string
}) => {
  const inviteRef = doc(invitesCollection, inviteId)
  const nextToken = createInviteToken()
  const nextSignupUrl = `${origin.replace(/\/$/, '')}/invite-signup/${nextToken}`
  const nextExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  await updateDoc(inviteRef, {
    signupUrl: nextSignupUrl,
    expiresAt: nextExpiresAt,
    regeneratedAt: nowIso(),
  })

  const updatedSnapshot = await getDoc(inviteRef)
  return withId(updatedSnapshot.id, updatedSnapshot.data()) as Invite
}

export const deleteInvite = async (inviteId: string) => {
  await deleteDoc(doc(invitesCollection, inviteId))
}

export const acceptInvite = async ({
  token,
  uid,
  email,
  displayName,
}: {
  token: string
  uid: string
  email: string
  displayName: string
}) => {
  const inviteRef = doc(invitesCollection, token)
  const inviteSnapshot = await getDoc(inviteRef)

  if (!inviteSnapshot.exists()) {
    throw new Error('Invite not found.')
  }

  const invite = withId(inviteSnapshot.id, inviteSnapshot.data()) as Invite

  if (invite.status !== 'pending') {
    throw new Error('This invite has already been used.')
  }

  if (invite.email.toLowerCase() !== email.toLowerCase()) {
    throw new Error('This account email does not match the invitation email.')
  }

  if (new Date(invite.expiresAt).getTime() < Date.now()) {
    throw new Error('This invite has expired.')
  }

  const accessProfileRef = doc(accessProfilesCollection, uid)
  const existingAccessProfileSnapshot = await getDoc(accessProfileRef)
  const existingAccessProfile = existingAccessProfileSnapshot.exists()
    ? (withId(existingAccessProfileSnapshot.id, existingAccessProfileSnapshot.data()) as SystemUser)
    : null

  const existingLinkedStudentIds = new Set(existingAccessProfile?.linkedStudentIds ?? [])
  const existingLinkedStudentNames = new Set(existingAccessProfile?.linkedStudentNames ?? [])

  if ((invite.role === 'Parent' || invite.role === 'ParentLeader') && invite.relatedStudentId) {
    existingLinkedStudentIds.add(invite.relatedStudentId)
  }

  if ((invite.role === 'Parent' || invite.role === 'ParentLeader') && invite.relatedStudentName) {
    existingLinkedStudentNames.add(invite.relatedStudentName)
  }

  if (
    (invite.role === 'Parent' || invite.role === 'ParentLeader') &&
    existingLinkedStudentIds.size > MAX_STUDENTS_PER_PARENT
  ) {
    throw new Error('This parent already has the maximum number of linked students.')
  }

  const resolvedRole =
    existingAccessProfile?.role && existingAccessProfile.role !== 'Guest' ? existingAccessProfile.role : invite.role

  await setDoc(
    accessProfileRef,
    removeUndefined({
      email,
      displayName,
      fullName: displayName,
      role: resolvedRole,
      permissions: rolePermissions[resolvedRole],
      status: 'active',
      department: existingAccessProfile?.department || invite.role,
      inviteToken: token,
      linkedStudentIds: Array.from(existingLinkedStudentIds),
      linkedStudentNames: Array.from(existingLinkedStudentNames),
    }),
    { merge: true }
  )

  await updateDoc(inviteRef, {
    status: 'accepted',
    acceptedAt: nowIso(),
    acceptedByUid: uid,
  })

  return invite
}

export const getClasses = async () => {
  try {
    const snapshot = await getDocs(query(classesCollection, orderBy('created_at', 'desc')))
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as Classroom[]
  } catch (error) {
    console.error('Error fetching classes:', error)
    return []
  }
}

export const createClassroom = async (classroom: Omit<Classroom, 'id' | 'created_at'>) => {
  try {
    const created_at = nowIso()
    const document = {
      ...classroom,
      created_at,
    }
    const ref = await addDoc(classesCollection, document)
    return withId(ref.id, document) as Classroom
  } catch (error) {
    console.error('Error creating classroom:', error)
    throw error
  }
}

export const updateClassroom = async (id: string, updates: Partial<Classroom>) => {
  try {
    const documentRef = doc(classesCollection, id)
    await updateDoc(documentRef, removeUndefined(updates))
    const snapshot = await getDoc(documentRef)
    return withId(snapshot.id, snapshot.data()) as Classroom
  } catch (error) {
    console.error('Error updating classroom:', error)
    throw error
  }
}

export const createClassTeacherAssignment = async (
  assignment: Omit<ClassTeacherAssignment, 'id' | 'created_at' | 'updated_at'>
) => {
  try {
    const created_at = nowIso()
    const document = {
      ...assignment,
      created_at,
      updated_at: created_at,
    }
    const ref = await addDoc(classTeacherAssignmentsCollection, document)
    return withId(ref.id, document) as ClassTeacherAssignment
  } catch (error) {
    console.error('Error creating class teacher assignment:', error)
    throw error
  }
}

export const updateClassTeacherAssignment = async (
  id: string,
  updates: Partial<Omit<ClassTeacherAssignment, 'id' | 'created_at' | 'updated_at'>> & Record<string, unknown>
) => {
  try {
    const documentRef = doc(classTeacherAssignmentsCollection, id)
    await updateDoc(
      documentRef,
      removeUndefined({
        ...updates,
        updated_at: nowIso(),
      })
    )
    const snapshot = await getDoc(documentRef)
    return withId(snapshot.id, snapshot.data()) as ClassTeacherAssignment
  } catch (error) {
    console.error('Error updating class teacher assignment:', error)
    throw error
  }
}

export const deleteClassTeacherAssignment = async (id: string) => {
  try {
    await deleteDoc(doc(classTeacherAssignmentsCollection, id))
  } catch (error) {
    console.error('Error deleting class teacher assignment:', error)
    throw error
  }
}

export const assignStudentToClass = async ({
  class_id,
  student_id,
}: {
  class_id: string
  student_id: string
}) => {
  try {
    const existingMemberships = await getDocs(query(classStudentsCollection, where('student_id', '==', student_id)))

    for (const existing of existingMemberships.docs) {
      const existingData = existing.data() as Partial<ClassStudent>
      if (existingData.class_id === class_id) {
        return withId(existing.id, existing.data()) as ClassStudent
      }
      await deleteDoc(doc(classStudentsCollection, existing.id))
    }

    const document = { class_id, student_id }
    const ref = await addDoc(classStudentsCollection, document)
    return withId(ref.id, document) as ClassStudent
  } catch (error) {
    console.error('Error assigning student to class:', error)
    throw error
  }
}

export const getApplicationsSettings = async () => {
  try {
    const snapshot = await getDoc(doc(systemSettingsCollection, 'applications'))
    if (!snapshot.exists()) {
      return { isOpen: true, updated_at: null as string | null }
    }
    return {
      isOpen: snapshot.data().isOpen !== false,
      updated_at: (snapshot.data().updated_at as string | undefined) ?? null,
    }
  } catch (error) {
    console.error('Error fetching application settings:', error)
    return { isOpen: true, updated_at: null as string | null }
  }
}

export const subscribeApplicationsSettings = (
  callback: (settings: { isOpen: boolean; updated_at: string | null }) => void
) => {
  const settingsRef = doc(systemSettingsCollection, 'applications')

  return onSnapshot(
    settingsRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback({ isOpen: true, updated_at: null })
        return
      }

      callback({
        isOpen: snapshot.data().isOpen !== false,
        updated_at: (snapshot.data().updated_at as string | undefined) ?? null,
      })
    },
    (error) => {
      console.error('Error subscribing to application settings:', error)
      callback({ isOpen: true, updated_at: null })
    }
  )
}

export const getPublicAiAssistantSettings = async () => {
  try {
    const snapshot = await getDoc(doc(systemSettingsCollection, 'public_ai_assistant'))
    if (!snapshot.exists()) {
      return {
        id: 'public_ai_assistant',
        enabled: true,
        hidden_message: '',
        updated_at: nowIso(),
      } as PublicAiAssistantSettings
    }

    return {
      id: snapshot.id,
      enabled: snapshot.data().enabled !== false,
      hidden_message: (snapshot.data().hidden_message as string | undefined) ?? '',
      updated_at: (snapshot.data().updated_at as string | undefined) ?? nowIso(),
      updated_by: snapshot.data().updated_by as string | undefined,
      updated_by_role: snapshot.data().updated_by_role as string | undefined,
    } as PublicAiAssistantSettings
  } catch (error) {
    console.error('Error fetching public AI assistant settings:', error)
    return {
      id: 'public_ai_assistant',
      enabled: true,
      hidden_message: '',
      updated_at: nowIso(),
    } as PublicAiAssistantSettings
  }
}

export const subscribePublicAiAssistantSettings = (
  callback: (settings: PublicAiAssistantSettings) => void
) => {
  const settingsRef = doc(systemSettingsCollection, 'public_ai_assistant')

  return onSnapshot(
    settingsRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback({
          id: 'public_ai_assistant',
          enabled: true,
          hidden_message: '',
          updated_at: nowIso(),
        })
        return
      }

      callback({
        id: snapshot.id,
        enabled: snapshot.data().enabled !== false,
        hidden_message: (snapshot.data().hidden_message as string | undefined) ?? '',
        updated_at: (snapshot.data().updated_at as string | undefined) ?? nowIso(),
        updated_by: snapshot.data().updated_by as string | undefined,
        updated_by_role: snapshot.data().updated_by_role as string | undefined,
      })
    },
    (error) => {
      console.error('Error subscribing to public AI assistant settings:', error)
      callback({
        id: 'public_ai_assistant',
        enabled: true,
        hidden_message: '',
        updated_at: nowIso(),
      })
    }
  )
}

export const updatePublicAiAssistantSettings = async ({
  enabled,
  hidden_message,
  updated_by,
  updated_by_role,
}: {
  enabled: boolean
  hidden_message?: string
  updated_by: string
  updated_by_role: string
}) => {
  const timestamp = nowIso()
  const settingsRef = doc(systemSettingsCollection, 'public_ai_assistant')
  await setDoc(
    settingsRef,
    removeUndefined({
      enabled,
      hidden_message: hidden_message?.trim() || '',
      updated_at: timestamp,
      updated_by,
      updated_by_role,
    }),
    { merge: true }
  )

  return {
    id: 'public_ai_assistant',
    enabled,
    hidden_message: hidden_message?.trim() || '',
    updated_at: timestamp,
    updated_by,
    updated_by_role,
  } as PublicAiAssistantSettings
}

export const getPublicAiConversationSummaries = async () => {
  try {
    const snapshot = await getDocs(query(publicAiConversationsCollection, orderBy('updated_at', 'desc')))
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as PublicAiConversationSummary[]
  } catch (error) {
    console.error('Error fetching public AI conversation summaries:', error)
    return []
  }
}

export const upsertPublicAiConversationSummary = async (
  sessionId: string,
  payload: Omit<PublicAiConversationSummary, 'id' | 'created_at' | 'updated_at' | 'session_id'> & {
    created_at?: string
    updated_at?: string
  }
) => {
  const timestamp = nowIso()
  const conversationRef = doc(publicAiConversationsCollection, sessionId)
  const existingSnapshot = await getDoc(conversationRef)
  const created_at = existingSnapshot.exists()
    ? ((existingSnapshot.data().created_at as string | undefined) ?? timestamp)
    : payload.created_at ?? timestamp

  const document = removeUndefined({
    ...payload,
    session_id: sessionId,
    created_at,
    updated_at: payload.updated_at ?? timestamp,
  })

  await setDoc(conversationRef, document, { merge: true })
  const snapshot = await getDoc(conversationRef)
  return withId(snapshot.id, snapshot.data()) as PublicAiConversationSummary
}

export const createNewsletterSubscriber = async ({
  email,
  source,
}: {
  email: string
  source: 'footer' | 'events'
}) => {
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail) {
    throw new Error('Email is required.')
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(normalizedEmail)) {
    throw new Error('Please provide a valid email address.')
  }

  const existing = await getDocs(query(newsletterSubscribersCollection, where('email', '==', normalizedEmail)))
  const existingDoc = existing.docs[0]
  const timestamp = nowIso()
  const sourceLabel = newsletterSourceLabels[source]

  if (existingDoc) {
    const existingData = existingDoc.data() as Partial<NewsletterSubscriber>
    const mergedSources = Array.from(
      new Set([...(existingData.sources ?? ([existingData.source].filter(Boolean) as Array<'footer' | 'events'>)), source])
    )

    await updateDoc(doc(newsletterSubscribersCollection, existingDoc.id), {
      source,
      source_label: sourceLabel,
      sources: mergedSources,
      status: 'subscribed',
      unsubscribed_at: null,
      updated_at: timestamp,
    })
    const snapshot = await getDoc(doc(newsletterSubscribersCollection, existingDoc.id))
    return {
      subscriber: withId(snapshot.id, snapshot.data()) as NewsletterSubscriber,
      duplicate: true,
    }
  }

  const document = {
    email: normalizedEmail,
    source,
    source_label: sourceLabel,
    sources: [source],
    status: 'subscribed' as const,
    unsubscribed_at: null,
    created_at: timestamp,
    updated_at: timestamp,
  }

  const ref = await addDoc(newsletterSubscribersCollection, document)
  return {
    subscriber: withId(ref.id, document) as NewsletterSubscriber,
    duplicate: false,
  }
}

export const getNewsletterSubscribers = async () => {
  try {
    const snapshot = await getDocs(query(newsletterSubscribersCollection, orderBy('created_at', 'desc')))
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as NewsletterSubscriber[]
  } catch (error) {
    console.error('Error fetching newsletter subscribers:', error)
    return []
  }
}

export const updateNewsletterSubscriber = async (
  id: string,
  updates: Partial<NewsletterSubscriber> & Record<string, unknown>
) => {
  try {
    const documentRef = doc(newsletterSubscribersCollection, id)
    await updateDoc(
      documentRef,
      removeUndefined({
        ...updates,
        updated_at: nowIso(),
      })
    )
    const snapshot = await getDoc(documentRef)
    return withId(snapshot.id, snapshot.data()) as NewsletterSubscriber
  } catch (error) {
    console.error('Error updating newsletter subscriber:', error)
    throw error
  }
}

export const deleteNewsletterSubscriber = async (id: string) => {
  try {
    await deleteDoc(doc(newsletterSubscribersCollection, id))
  } catch (error) {
    console.error('Error deleting newsletter subscriber:', error)
    throw error
  }
}

export const updateApplicationsSettings = async (isOpen: boolean) => {
  const settingsRef = doc(systemSettingsCollection, 'applications')
  await setDoc(
    settingsRef,
    {
      isOpen,
      updated_at: nowIso(),
    },
    { merge: true }
  )

  const snapshot = await getDoc(settingsRef)
  return {
    isOpen: snapshot.data()?.isOpen !== false,
    updated_at: (snapshot.data()?.updated_at as string | undefined) ?? null,
  }
}

export const getClassStudents = async () => {
  try {
    const snapshot = await getDocs(classStudentsCollection)
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as ClassStudent[]
  } catch (error) {
    console.error('Error fetching class students:', error)
    return []
  }
}

export const getClassPosts = async () => {
  try {
    const snapshot = await getDocs(query(classPostsCollection, orderBy('created_at', 'desc')))
    return snapshot.docs.map((entry) => withId(entry.id, entry.data())) as ClassPost[]
  } catch (error) {
    console.error('Error fetching class posts:', error)
    return []
  }
}

// Dashboard Statistics
export const getDashboardStats = async () => {
  try {
    const [applications, events, donations, students, boardMembers] = await Promise.all([
      getApplications(),
      getEvents(),
      getDonations(),
      getStudents(),
      getBoardMembers(),
    ])

    const totalDonations = donations
      .filter((donation) => donation.payment_status === 'completed')
      .reduce((sum, donation) => sum + donation.amount, 0)

    const pendingApplications = applications.filter((application) => application.status === 'pending').length
    const upcomingEvents = events.filter(
      (event) => new Date(event.event_date) >= new Date() && event.status === 'upcoming'
    ).length

    return {
      totalApplications: applications.length,
      pendingApplications,
      totalStudents: students.length,
      upcomingEvents,
      totalDonations,
      totalBoardMembers: boardMembers.length,
      applicationsByStatus: {
        pending: applications.filter((application) => application.status === 'pending').length,
        review: applications.filter((application) => application.status === 'review').length,
        admitted: applications.filter((application) => application.status === 'admitted').length,
        rejected: applications.filter((application) => application.status === 'rejected').length,
        waitlist: applications.filter((application) => application.status === 'waitlist').length,
      },
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return mockDashboardStats
  }
}
