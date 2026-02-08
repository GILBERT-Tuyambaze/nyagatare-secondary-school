import { supabase } from '@/lib/supabase'
import { Application, Event, Donation, BoardMember, Student } from '@/types/database'

// Applications
export const getApplications = async () => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Application[]
  } catch (error) {
    console.error('Error fetching applications:', error)
    return []
  }
}

export const getApplicationById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Application
  } catch (error) {
    console.error('Error fetching application:', error)
    return null
  }
}

export const getApplicationByApplicationId = async (applicationId: string) => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('application_id', applicationId)
      .single()
    
    if (error) throw error
    return data as Application
  } catch (error) {
    console.error('Error fetching application:', error)
    return null
  }
}

export const createApplication = async (application: Omit<Application, 'id' | 'application_id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .insert(application)
      .select()
      .single()
    
    if (error) throw error
    return data as Application
  } catch (error) {
    console.error('Error creating application:', error)
    throw error
  }
}

export const updateApplication = async (id: string, updates: Partial<Application>) => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Application
  } catch (error) {
    console.error('Error updating application:', error)
    throw error
  }
}

export const deleteApplication = async (id: string) => {
  try {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  } catch (error) {
    console.error('Error deleting application:', error)
    throw error
  }
}

// Events
export const getEvents = async () => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true })
    
    if (error) throw error
    return data as Event[]
  } catch (error) {
    console.error('Error fetching events:', error)
    return []
  }
}

export const createEvent = async (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single()
    
    if (error) throw error
    return data as Event
  } catch (error) {
    console.error('Error creating event:', error)
    throw error
  }
}

export const updateEvent = async (id: string, updates: Partial<Event>) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Event
  } catch (error) {
    console.error('Error updating event:', error)
    throw error
  }
}

export const deleteEvent = async (id: string) => {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  } catch (error) {
    console.error('Error deleting event:', error)
    throw error
  }
}

// Donations
export const getDonations = async () => {
  try {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Donation[]
  } catch (error) {
    console.error('Error fetching donations:', error)
    return []
  }
}

export const createDonation = async (donation: Omit<Donation, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('donations')
      .insert(donation)
      .select()
      .single()
    
    if (error) throw error
    return data as Donation
  } catch (error) {
    console.error('Error creating donation:', error)
    throw error
  }
}

// Board Members
export const getBoardMembers = async () => {
  try {
    const { data, error } = await supabase
      .from('board_members')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('full_name', { ascending: true })
    
    if (error) throw error
    return data as BoardMember[]
  } catch (error) {
    console.error('Error fetching board members:', error)
    // Return mock data if database is not available
    return [
      {
        id: '1',
        full_name: 'Mr. Martin Hatanga',
        position: 'Head of Science Computer Science',
        category: 'teacher' as const,
        bio: 'Mr. Martin Hatanga is a Computer Science Teacher and counsellor, supporting students in both technical education and academic guidance while promoting digital skills development.,
        email: 'martinhatanga1@gmail.com',
        phone: '+250 784 223 143,
        qualifications: '',
        experience_years: 15,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        id: '2',
        full_name: 'Mr. AINEBYOONA Dickson ',
        position: 'Director Of Studies',
        category: 'teacher' as const,
        bio: 'Mr. Dickson Ainebyoona serves as Director of Studies at Nyagatare Secondary School, where he oversees academic programs, supports curriculum implementation, and promotes high standards of teaching and learning.',
        email: '',
        phone: '+250 785 972 954',
        qualifications: 'MA in English Literature, TESOL Certification',
        experience_years: 12,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        id: '3',
        full_name: 'Mr. Claver MUSHATSI',
        position: 'School Principal',
        category: 'leader' as const,
        bio: 'Mr. Claver has been leading Nyagatare Secondary School for the past 3 years. Under his leadership, the school has achieved remarkable academic excellence and infrastructure development.',
        email: '',
        phone: '+250 783 789 872',
        qualifications: 'MEd in Educational Leadership, BA in Education',
        experience_years: 20,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        id: '4',
        full_name: 'Mr. Charles Habimana',
        position: 'Parent Board Chairman',
        category: 'parent' as const,
        bio: 'Mr. Habimana represents the parent community and works closely with the school administration to ensure student welfare and academic success.',
        email: '',
        phone: '+250 788 100 005',
        qualifications: 'MBA in Business Administration',
        experience_years: 5,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    ]
  }
}

export const createBoardMember = async (member: Omit<BoardMember, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error } = await supabase
      .from('board_members')
      .insert(member)
      .select()
      .single()
    
    if (error) throw error
    return data as BoardMember
  } catch (error) {
    console.error('Error creating board member:', error)
    throw error
  }
}

export const updateBoardMember = async (id: string, updates: Partial<BoardMember>) => {
  try {
    const { data, error } = await supabase
      .from('board_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as BoardMember
  } catch (error) {
    console.error('Error updating board member:', error)
    throw error
  }
}

export const deleteBoardMember = async (id: string) => {
  try {
    const { error } = await supabase
      .from('board_members')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  } catch (error) {
    console.error('Error deleting board member:', error)
    throw error
  }
}

// Students
export const getStudents = async () => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Student[]
  } catch (error) {
    console.error('Error fetching students:', error)
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
      getBoardMembers()
    ])

    const totalDonations = donations
      .filter(d => d.payment_status === 'completed')
      .reduce((sum, d) => sum + d.amount, 0)

    const pendingApplications = applications.filter(a => a.status === 'pending').length
    const upcomingEvents = events.filter(e => new Date(e.event_date) >= new Date() && e.status === 'upcoming').length

    return {
      totalApplications: applications.length,
      pendingApplications,
      totalStudents: students.length,
      upcomingEvents,
      totalDonations,
      totalBoardMembers: boardMembers.length,
      applicationsByStatus: {
        pending: applications.filter(a => a.status === 'pending').length,
        review: applications.filter(a => a.status === 'review').length,
        approved: applications.filter(a => a.status === 'approved').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
        waitlist: applications.filter(a => a.status === 'waitlist').length,
      }
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    // Return mock data if database is not available
    return {
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
      }
    }
  }
}
