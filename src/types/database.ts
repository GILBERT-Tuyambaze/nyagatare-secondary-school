export interface Student {
  id: string
  student_id: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other'
  phone?: string
  email?: string
  address: string
  status: 'active' | 'inactive' | 'graduated' | 'transferred'
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  application_id: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string
  phone?: string
  email?: string
  address: string
  guardian_name: string
  guardian_relationship: string
  guardian_phone: string
  guardian_email?: string
  guardian_occupation?: string
  emergency_contact?: string
  urubuto_id?: string
  sdms_code?: string
  report_link?: string
  report_file_name?: string
  previous_school: string
  applying_grade: string
  academic_year: string
  preferred_subjects?: string
  achievements?: string
  motivation: string
  status: 'pending' | 'review' | 'admitted' | 'rejected' | 'waitlist'
  score: number
  admin_notes?: string
  communication_notes?: string
  decision_notes?: string
  applicant_invite_id?: string
  applicant_signup_url?: string
  assigned_to?: string
  last_contacted_at?: string
  last_contacted_by?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  title: string
  description?: string
  event_date: string
  start_time?: string
  end_time?: string
  location?: string
  category: 'academic' | 'sports' | 'cultural' | 'meeting' | 'ceremony' | 'other'
  max_attendees?: number
  current_attendees: number
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  image_url?: string
  media_gallery?: ContentMediaItem[]
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Donation {
  id: string
  donor_name: string
  donor_email?: string
  donor_phone?: string
  amount: number
  currency: string
  donation_type: 'general' | 'scholarship' | 'equipment' | 'infrastructure' | 'other'
  payment_method?: string
  payment_provider?: 'flutterwave' | 'bank_transfer' | 'cash' | 'other'
  payment_link?: string
  payment_reference?: string
  receipt_url?: string
  receipt_path?: string
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
  message?: string
  is_anonymous: boolean
  created_at: string
  updated_at: string
}

export interface NewsletterSubscriber {
  id: string
  email: string
  source: 'footer' | 'events'
  source_label: 'Homepage Footer' | 'Events Page'
  sources?: Array<'footer' | 'events'>
  status?: 'subscribed' | 'unsubscribed'
  unsubscribed_at?: string | null
  created_at: string
  updated_at: string
}

export interface ContentMediaItem {
  id: string
  type: 'image' | 'video'
  source: 'upload' | 'link' | 'google_drive'
  url: string
  preview_url?: string
  title?: string
  file_name?: string
  mime_type?: string
  storage_path?: string
}

export interface ContentPost {
  id: string
  title: string
  slug: string
  type: 'news' | 'blog' | 'announcement'
  status: 'draft' | 'review' | 'published'
  excerpt?: string
  body: string
  featured_image?: string
  media_gallery?: ContentMediaItem[]
  author_name?: string
  published_at?: string
  created_at: string
  updated_at: string
}

export interface SchoolSubject {
  id: string
  name: string
  code: string
  department: string
  created_at: string
  updated_at: string
}

export interface ClassTeacherAssignment {
  id: string
  class_id: string
  teacher_user_id: string
  teacher_name: string
  subject_id: string
  subject_name: string
  academic_year: string
  term: string
  can_invite_students: boolean
  can_invite_parents: boolean
  can_change_class: boolean
  created_at: string
  updated_at: string
}

export interface LearningResource {
  id: string
  class_id: string
  subject_id?: string
  subject_name?: string
  teacher_user_id: string
  teacher_name: string
  type: 'assignment' | 'exercise' | 'holiday_package' | 'notes' | 'material'
  title: string
  description: string
  attachment_url?: string
  due_date?: string
  created_at: string
  updated_at: string
}

export interface StudentMark {
  id: string
  class_id: string
  student_id: string
  student_name: string
  subject_id: string
  subject_name: string
  teacher_user_id: string
  teacher_name: string
  score: number
  max_score: number
  term: string
  academic_year: string
  comment?: string
  created_at: string
  updated_at: string
}

export interface MarkComment {
  id: string
  mark_id: string
  student_id: string
  student_name: string
  message: string
  created_at: string
}

export interface ChatThread {
  id: string
  class_id: string
  type: 'common' | 'private_subject'
  title: string
  subject_id?: string
  subject_name?: string
  student_id?: string
  teacher_user_id?: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  thread_id: string
  sender_uid: string
  sender_name: string
  sender_role: string
  message: string
  is_ghost?: boolean
  created_at: string
}

export interface DisciplineCase {
  id: string
  class_id?: string
  student_id: string
  student_name: string
  title: string
  summary: string
  status: 'warning' | 'monitoring' | 'resolved'
  staff_comment?: string
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  action: string
  actor_uid?: string
  actor_name: string
  actor_role?: string
  target_type: string
  target_id: string
  summary: string
  created_at: string
}

export interface BoardMember {
  id: string
  full_name: string
  position: string
  category: 'teacher' | 'leader' | 'parent'
  bio?: string
  profile_image?: string
  email?: string
  phone?: string
  qualifications?: string
  experience_years?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: 'super_admin' | 'admin' | 'staff' | 'teacher'
  permissions: string[]
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
}
