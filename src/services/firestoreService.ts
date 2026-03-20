import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore'
import { db } from '@/firebase'
import { Application, Event, Donation, BoardMember, Student } from '@/types/database'
import { ClassPost, Classroom, ClassStudent, Invite, Role, SystemUser } from '@/loginpage/types'
import { rolePermissions } from '@/loginpage/lib/rbac'

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
const classesCollection = collection(db, 'classes')
const classStudentsCollection = collection(db, 'class_students')
const classPostsCollection = collection(db, 'class_posts')
const systemSettingsCollection = collection(db, 'system_settings')

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
    approved: 89,
    rejected: 12,
    waitlist: 9,
  },
}

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
    const document = {
      ...donation,
      created_at,
      updated_at: created_at,
    }
    const ref = await addDoc(donationsCollection, document)
    return withId(ref.id, document) as Donation
  } catch (error) {
    console.error('Error creating donation:', error)
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

export const createInvite = async ({
  email,
  role,
  invitedBy,
  invitedByUid,
  invitedByRole,
  origin,
}: {
  email: string
  role: Role
  invitedBy: string
  invitedByUid: string
  invitedByRole: Role
  origin: string
}) => {
  try {
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
  await setDoc(accessProfileRef, {
    email,
    displayName,
    fullName: displayName,
    role: invite.role,
    permissions: rolePermissions[invite.role],
    status: 'active',
    department: invite.role,
    inviteToken: token,
  })

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

export const getApplicationsSettings = async () => {
  try {
    const snapshot = await getDoc(doc(systemSettingsCollection, 'applications'))
    if (!snapshot.exists()) {
      return { isOpen: true }
    }
    return { isOpen: snapshot.data().isOpen !== false }
  } catch (error) {
    console.error('Error fetching application settings:', error)
    return { isOpen: true }
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
  return { isOpen: snapshot.data()?.isOpen !== false }
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
        approved: applications.filter((application) => application.status === 'approved').length,
        rejected: applications.filter((application) => application.status === 'rejected').length,
        waitlist: applications.filter((application) => application.status === 'waitlist').length,
      },
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return mockDashboardStats
  }
}
