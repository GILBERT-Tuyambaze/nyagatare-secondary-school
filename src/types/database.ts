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
  previous_school: string
  applying_grade: string
  academic_year: string
  preferred_subjects?: string
  achievements?: string
  motivation: string
  status: 'pending' | 'review' | 'approved' | 'rejected' | 'waitlist'
  score: number
  admin_notes?: string
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
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_reference?: string
  message?: string
  is_anonymous: boolean
  created_at: string
  updated_at: string
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