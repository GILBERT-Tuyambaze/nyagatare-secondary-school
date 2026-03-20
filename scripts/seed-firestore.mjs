import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, writeBatch } from 'firebase/firestore'

function loadEnvFile(filePath) {
  const content = readFileSync(filePath, 'utf8')
  const result = {}

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const index = line.indexOf('=')
    if (index === -1) continue
    const key = line.slice(0, index).trim()
    let value = line.slice(index + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    result[key] = value
  }

  return result
}

const env = loadEnvFile(resolve('.env.local'))

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const rolePermissions = {
  SuperAdmin: ['manage_users', 'assign_roles', 'view_reports', 'upload_marks', 'view_marks', 'manage_content', 'publish_news', 'manage_discipline', 'manage_finance'],
  Headmaster: ['view_reports', 'assign_roles', 'manage_users', 'publish_news'],
  DOS: ['upload_marks', 'view_reports'],
  DOD: ['manage_discipline', 'view_reports'],
  Bursar: ['manage_finance', 'view_reports'],
  HOD: ['upload_marks', 'view_reports'],
  Teacher: ['upload_marks', 'view_marks'],
  Student: ['view_marks'],
  StudentLeader: ['view_marks', 'view_reports'],
  Parent: ['view_marks'],
  ParentLeader: ['view_reports'],
  ContentManager: ['manage_content', 'publish_news'],
  Applicant: [],
  Guest: [],
}

const accessProfiles = [
  {
    id: 'usr-1',
    email: 'gilberttuyambaze00@gmail.com',
    displayName: 'Gilbert Tuyambaze',
    role: 'SuperAdmin',
    permissions: rolePermissions.SuperAdmin,
    status: 'active',
    department: 'Digital Operations',
  },
  {
    id: 'usr-2',
    email: 'headmaster@nyagataress.edu.rw',
    displayName: 'Jane Mukamana',
    role: 'Headmaster',
    permissions: rolePermissions.Headmaster,
    status: 'active',
    department: 'Leadership',
  },
  {
    id: 'usr-3',
    email: 'teacher.math@nyagataress.edu.rw',
    displayName: 'Eric Habimana',
    role: 'Teacher',
    permissions: rolePermissions.Teacher,
    status: 'active',
    department: 'Academics',
  },
  {
    id: 'usr-4',
    email: 'bursar@nyagataress.edu.rw',
    displayName: 'Aline Uwase',
    role: 'Bursar',
    permissions: rolePermissions.Bursar,
    status: 'invited',
    department: 'Finance',
  },
]

const students = [
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

const applications = [
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

const events = [
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

const donations = [
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

const boardMembers = [
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

const collections = [
  ['access_profiles', accessProfiles],
  ['students', students],
  ['applications', applications],
  ['events', events],
  ['donations', donations],
  ['board_members', boardMembers],
]

const batch = writeBatch(db)

for (const [collectionName, docs] of collections) {
  for (const entry of docs) {
    batch.set(doc(db, collectionName, entry.id), entry, { merge: true })
  }
}

await batch.commit()

console.log(
  JSON.stringify(
    {
      ok: true,
      projectId: firebaseConfig.projectId,
      collections: collections.map(([name, docs]) => ({ name, count: docs.length })),
    },
    null,
    2
  )
)
