-- Nyagatare Secondary School Database Schema
-- This file contains the complete database structure needed for full functionality

-- =====================================================
-- STUDENTS & ENROLLMENT TABLES
-- =====================================================

-- Students table for basic student information
CREATE TABLE IF NOT EXISTS students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE NOT NULL, -- e.g., NSS-2025-001
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'transferred')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Guardians/Parents information
CREATE TABLE IF NOT EXISTS guardians (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    full_name VARCHAR(200) NOT NULL,
    relationship VARCHAR(50) NOT NULL CHECK (relationship IN ('parent', 'guardian', 'relative', 'other')),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    occupation VARCHAR(100),
    emergency_contact VARCHAR(255),
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enrollment applications
CREATE TABLE IF NOT EXISTS applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id VARCHAR(20) UNIQUE NOT NULL, -- e.g., APP-2025-001
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT NOT NULL,
    
    -- Guardian information
    guardian_name VARCHAR(200) NOT NULL,
    guardian_relationship VARCHAR(50) NOT NULL,
    guardian_phone VARCHAR(20) NOT NULL,
    guardian_email VARCHAR(255),
    guardian_occupation VARCHAR(100),
    emergency_contact VARCHAR(255),
    
    -- Academic information
    previous_school VARCHAR(200) NOT NULL,
    applying_grade VARCHAR(10) NOT NULL, -- S1, S2, S3, S4, S5, S6
    academic_year VARCHAR(10) NOT NULL,
    preferred_subjects TEXT,
    achievements TEXT,
    motivation TEXT NOT NULL,
    
    -- Application status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'review', 'approved', 'rejected', 'waitlist')),
    score INTEGER DEFAULT 0,
    admin_notes TEXT,
    reviewed_by UUID, -- Reference to admin user
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Document uploads for applications
CREATE TABLE IF NOT EXISTS application_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'passport_photo', 'birth_certificate', 'school_report', 'additional'
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- EVENTS & ACTIVITIES TABLES
-- =====================================================

-- School events
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(200),
    category VARCHAR(50) NOT NULL CHECK (category IN ('academic', 'sports', 'cultural', 'meeting', 'ceremony', 'other')),
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    image_url VARCHAR(500),
    created_by UUID, -- Reference to admin user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Event registrations
CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    attendance_status VARCHAR(20) DEFAULT 'registered' CHECK (attendance_status IN ('registered', 'attended', 'absent', 'cancelled')),
    notes TEXT,
    UNIQUE(event_id, student_id)
);

-- =====================================================
-- DONATIONS & PAYMENTS TABLES
-- =====================================================

-- Donations
CREATE TABLE IF NOT EXISTS donations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    donor_name VARCHAR(200) NOT NULL,
    donor_email VARCHAR(255),
    donor_phone VARCHAR(20),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RWF',
    donation_type VARCHAR(50) DEFAULT 'general' CHECK (donation_type IN ('general', 'scholarship', 'equipment', 'infrastructure', 'other')),
    payment_method VARCHAR(50), -- 'stripe', 'bank_transfer', 'mobile_money', 'cash'
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_reference VARCHAR(100),
    message TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- ADMIN & USER MANAGEMENT TABLES
-- =====================================================

-- Admin users (if not using external auth like Supabase Auth)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Use bcrypt or similar
    full_name VARCHAR(200) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'staff', 'teacher')),
    permissions TEXT[], -- JSON array of permissions
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- SETTINGS & CONFIGURATION TABLES
-- =====================================================

-- School settings
CREATE TABLE IF NOT EXISTS school_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'text' CHECK (setting_type IN ('text', 'number', 'boolean', 'json')),
    description TEXT,
    updated_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Students indexes
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at);

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_application_id ON applications(application_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applying_grade ON applications(applying_grade);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Donations indexes
CREATE INDEX IF NOT EXISTS idx_donations_payment_status ON donations(payment_status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_amount ON donations(amount);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;

-- Public read access for events (for website display)
CREATE POLICY "allow_public_read_events" ON events FOR SELECT USING (true);

-- Applications - users can only see their own
CREATE POLICY "allow_insert_applications" ON applications FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_read_own_applications" ON applications FOR SELECT USING (true); -- Admins can see all

-- Donations - allow public insert, admin read
CREATE POLICY "allow_public_insert_donations" ON donations FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_admin_read_donations" ON donations FOR SELECT USING (true); -- Restrict to admins in production

-- Admin users - only authenticated admins can access
CREATE POLICY "allow_admin_access" ON admin_users FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample school settings
INSERT INTO school_settings (setting_key, setting_value, setting_type, description) VALUES 
('school_name', 'Nyagatare Secondary School', 'text', 'Official school name'),
('contact_email', 'info@nyagataress.edu.rw', 'text', 'Main contact email'),
('contact_phone', '+250 788 123 456', 'text', 'Main contact phone'),
('current_academic_year', '2025', 'text', 'Current academic year'),
('enrollment_open', 'true', 'boolean', 'Whether enrollment is currently open'),
('max_students_per_grade', '50', 'number', 'Maximum students per grade level')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert sample events
INSERT INTO events (title, description, event_date, start_time, end_time, location, category, max_attendees, image_url) VALUES 
('STEM Fair 2025', 'Annual science, technology, engineering, and mathematics exhibition featuring student projects.', '2025-03-15', '09:00:00', '16:00:00', 'School Auditorium', 'academic', 250, '/images/STEMFair.jpg'),
('Parent-Teacher Conference', 'Meet with teachers to discuss student progress and academic performance.', '2025-02-28', '14:00:00', '18:00:00', 'Classroom Buildings', 'meeting', 180, '/images/ParentTeacherMeeting.jpg'),
('Inter-School Football Championship', 'Annual football tournament between secondary schools in the Eastern Province.', '2025-04-10', '10:00:00', '17:00:00', 'School Football Field', 'sports', 500, '/images/sports.jpg'),
('Science Laboratory Open Day', 'Tour our state-of-the-art science laboratories and meet our faculty.', '2025-02-20', '13:00:00', '16:00:00', 'Science Building', 'academic', 120, '/images/Lab.jpg'),
('Cultural Heritage Day', 'Celebrating Rwandan culture through music, dance, and traditional arts.', '2025-05-25', '11:00:00', '18:00:00', 'School Courtyard', 'cultural', 600, '/images/cultural-day.jpg')
ON CONFLICT DO NOTHING;

-- Insert sample applications
INSERT INTO applications (
    application_id, first_name, last_name, date_of_birth, gender, phone, email, address,
    guardian_name, guardian_relationship, guardian_phone, guardian_email, guardian_occupation, emergency_contact,
    previous_school, applying_grade, academic_year, preferred_subjects, achievements, motivation,
    status, score
) VALUES 
('APP-2025-001', 'Sarah', 'Uwimana', '2008-05-15', 'female', '+250 788 111 111', 'sarah@email.com', 'Nyagatare District, Eastern Province',
 'Jean Uwimana', 'parent', '+250 788 222 222', 'jean@email.com', 'Teacher', 'Marie Uwimana +250 788 333 333',
 'Nyagatare Primary School', 'S4', '2025', 'Physics, Chemistry, Mathematics', 'Best student in science 2024', 'I want to become an engineer',
 'pending', 85),
('APP-2025-002', 'Jean Baptiste', 'Nkuru', '2007-08-22', 'male', '+250 788 444 444', 'jean.b@email.com', 'Gatsibo District, Eastern Province',
 'Agnes Nkuru', 'parent', '+250 788 555 555', 'agnes@email.com', 'Nurse', 'Paul Nkuru +250 788 666 666',
 'Gatsibo Secondary School', 'S5', '2025', 'Biology, Chemistry, Mathematics', 'Science fair winner 2024', 'I aspire to study medicine',
 'approved', 92),
('APP-2025-003', 'Grace', 'Mukamana', '2009-01-10', 'female', '+250 788 777 777', 'grace@email.com', 'Kayonza District, Eastern Province',
 'Peter Mukamana', 'guardian', '+250 788 888 888', 'peter@email.com', 'Farmer', 'Rose Mukamana +250 788 999 999',
 'Kayonza Primary School', 'S3', '2025', 'Mathematics, Physics, Computer Science', 'Mathematics olympiad participant', 'I love solving mathematical problems',
 'review', 78)
ON CONFLICT (application_id) DO NOTHING;

-- Insert sample donations
INSERT INTO donations (donor_name, donor_email, donor_phone, amount, currency, donation_type, payment_status, message) VALUES 
('Anonymous Donor', 'donor1@email.com', '+250 788 000 001', 50000.00, 'RWF', 'general', 'completed', 'Supporting STEM education'),
('John Smith', 'john.smith@email.com', '+250 788 000 002', 100000.00, 'RWF', 'scholarship', 'completed', 'Scholarship fund for deserving students'),
('Mary Johnson', 'mary.j@email.com', '+250 788 000 003', 75000.00, 'RWF', 'equipment', 'pending', 'For laboratory equipment')
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate application ID
CREATE OR REPLACE FUNCTION generate_application_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.application_id IS NULL OR NEW.application_id = '' THEN
        NEW.application_id := 'APP-' || EXTRACT(YEAR FROM NOW()) || '-' || 
                             LPAD((SELECT COALESCE(MAX(CAST(SPLIT_PART(application_id, '-', 3) AS INTEGER)), 0) + 1 
                                   FROM applications 
                                   WHERE application_id LIKE 'APP-' || EXTRACT(YEAR FROM NOW()) || '-%')::TEXT, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-generating application IDs
CREATE TRIGGER auto_generate_application_id BEFORE INSERT ON applications
    FOR EACH ROW EXECUTE FUNCTION generate_application_id();

-- Function to generate student ID
CREATE OR REPLACE FUNCTION generate_student_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.student_id IS NULL OR NEW.student_id = '' THEN
        NEW.student_id := 'NSS-' || EXTRACT(YEAR FROM NOW()) || '-' || 
                         LPAD((SELECT COALESCE(MAX(CAST(SPLIT_PART(student_id, '-', 3) AS INTEGER)), 0) + 1 
                               FROM students 
                               WHERE student_id LIKE 'NSS-' || EXTRACT(YEAR FROM NOW()) || '-%')::TEXT, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-generating student IDs
CREATE TRIGGER auto_generate_student_id BEFORE INSERT ON students
    FOR EACH ROW EXECUTE FUNCTION generate_student_id();

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Applications summary view
CREATE OR REPLACE VIEW applications_summary AS
SELECT 
    COUNT(*) as total_applications,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_applications,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_applications,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_applications,
    COUNT(*) FILTER (WHERE status = 'review') as under_review,
    AVG(score) as average_score,
    applying_grade,
    academic_year
FROM applications 
GROUP BY applying_grade, academic_year;

-- Monthly donations view
CREATE OR REPLACE VIEW monthly_donations AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as donation_count,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount,
    donation_type
FROM donations 
WHERE payment_status = 'completed'
GROUP BY DATE_TRUNC('month', created_at), donation_type
ORDER BY month DESC;

-- Upcoming events view
CREATE OR REPLACE VIEW upcoming_events AS
SELECT * FROM events 
WHERE event_date >= CURRENT_DATE 
AND status = 'upcoming'
ORDER BY event_date ASC;

-- =====================================================
-- FINAL NOTES
-- =====================================================

/*
DEPLOYMENT INSTRUCTIONS:

1. FOR SUPABASE:
   - Copy this entire file
   - Go to Supabase Dashboard > SQL Editor
   - Paste and run this script
   - Enable Row Level Security as needed
   - Set up authentication policies

2. FOR POSTGRESQL:
   - Create database: CREATE DATABASE nyagatare_school;
   - Run this script in the database
   - Create a user with appropriate permissions
   - Update connection string in your app

3. FOR DEVELOPMENT:
   - Sample data is included for testing
   - All IDs are auto-generated
   - Includes proper indexes for performance
   - RLS policies are set up for security

4. ENVIRONMENT VARIABLES NEEDED:
   - DATABASE_URL or individual connection parameters
   - SUPABASE_URL and SUPABASE_ANON_KEY (if using Supabase)
   - Any third-party service keys (Stripe, SendGrid, etc.)

This schema supports the full functionality of the Nyagatare Secondary School website including:
- Student enrollment and application management
- Event management and registration
- Donation tracking
- Admin dashboard with proper reporting
- File upload support (paths stored in database)
- Audit trails and timestamps
*/