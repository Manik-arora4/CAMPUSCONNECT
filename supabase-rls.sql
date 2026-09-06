-- ============================================
-- CAMPUSCONNECT ROW LEVEL SECURITY (RLS) POLICIES
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudentProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FacultyProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "College" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Department" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Course" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Section" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subject" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Enrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AttendanceSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Assignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Exam" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Club" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Opportunity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Application" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Resume" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupportTicket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserPreference" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AIPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TimetableSlot" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get current user ID from JWT
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS INTEGER AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true), '')::json->>'id'
$$ LANGUAGE sql STABLE;

-- Get current user role from JWT
CREATE OR REPLACE FUNCTION auth.user_role() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true), '')::json->>'role'
$$ LANGUAGE sql STABLE;

-- Get current user college from JWT
CREATE OR REPLACE FUNCTION auth.user_college() RETURNS INTEGER AS $$
  SELECT (NULLIF(current_setting('request.jwt.claims', true), '')::json->>'collegeId')::INTEGER
$$ LANGUAGE sql STABLE;

-- ============================================
-- USERS TABLE
-- ============================================

-- Users can read their own profile
CREATE POLICY "users_select_own" ON "User"
  FOR SELECT USING (
    id::TEXT = auth.user_id()
    OR auth.user_role() = 'ADMIN'
  );

-- Admins can insert/update users
CREATE POLICY "users_admin_insert" ON "User"
  FOR INSERT WITH CHECK (
    auth.user_role() = 'ADMIN'
    OR role = 'STUDENT'  -- Allow self-registration for students
  );

CREATE POLICY "users_admin_update" ON "User"
  FOR UPDATE USING (
    id::TEXT = auth.user_id()
    OR auth.user_role() = 'ADMIN'
  );

-- ============================================
-- COLLEGES TABLE (Public read)
-- ============================================

CREATE POLICY "colleges_select" ON "College"
  FOR SELECT USING (true);

CREATE POLICY "colleges_admin_insert" ON "College"
  FOR INSERT WITH CHECK (auth.user_role() = 'ADMIN');

CREATE POLICY "colleges_admin_update" ON "College"
  FOR UPDATE USING (auth.user_role() = 'ADMIN');

-- ============================================
-- DEPARTMENTS TABLE
-- ============================================

CREATE POLICY "departments_select" ON "Department"
  FOR SELECT USING (true);

CREATE POLICY "departments_admin_insert" ON "Department"
  FOR INSERT WITH CHECK (auth.user_role() = 'ADMIN');

CREATE POLICY "departments_admin_update" ON "Department"
  FOR UPDATE USING (auth.user_role() = 'ADMIN');

-- ============================================
-- COURSES TABLE
-- ============================================

CREATE POLICY "courses_select" ON "Course"
  FOR SELECT USING (true);

CREATE POLICY "courses_admin_insert" ON "Course"
  FOR INSERT WITH CHECK (auth.user_role() = 'ADMIN');

CREATE POLICY "courses_admin_update" ON "Course"
  FOR UPDATE USING (auth.user_role() = 'ADMIN');

-- ============================================
-- SECTIONS TABLE
-- ============================================

CREATE POLICY "sections_select" ON "Section"
  FOR SELECT USING (true);

CREATE POLICY "sections_admin_insert" ON "Section"
  FOR INSERT WITH CHECK (auth.user_role() = 'ADMIN');

CREATE POLICY "sections_admin_update" ON "Section"
  FOR UPDATE USING (auth.user_role() = 'ADMIN');

-- ============================================
-- SUBJECTS TABLE
-- ============================================

CREATE POLICY "subjects_select" ON "Subject"
  FOR SELECT USING (true);

CREATE POLICY "subjects_admin_insert" ON "Subject"
  FOR INSERT WITH CHECK (auth.user_role() = 'ADMIN');

CREATE POLICY "subjects_admin_update" ON "Subject"
  FOR UPDATE USING (auth.user_role() = 'ADMIN');

-- ============================================
-- STUDENT PROFILES
-- ============================================

CREATE POLICY "student_profiles_select_own" ON "StudentProfile"
  FOR SELECT USING (
    "userId"::TEXT = auth.user_id()
    OR auth.user_role() = 'ADMIN'
    OR (auth.user_role() = 'FACULTY' AND "collegeId" = auth.user_college())
  );

CREATE POLICY "student_profiles_insert_own" ON "StudentProfile"
  FOR INSERT WITH CHECK (
    "userId"::TEXT = auth.user_id()
    OR auth.user_role() = 'ADMIN'
  );

CREATE POLICY "student_profiles_update_own" ON "StudentProfile"
  FOR UPDATE USING (
    "userId"::TEXT = auth.user_id()
    OR auth.user_role() = 'ADMIN'
  );

-- ============================================
-- FACULTY PROFILES
-- ============================================

CREATE POLICY "faculty_profiles_select_own" ON "FacultyProfile"
  FOR SELECT USING (
    "userId"::TEXT = auth.user_id()
    OR auth.user_role() = 'ADMIN'
    OR (auth.user_role() = 'FACULTY' AND "collegeId" = auth.user_college())
  );

CREATE POLICY "faculty_profiles_insert_own" ON "FacultyProfile"
  FOR INSERT WITH CHECK (
    "userId"::TEXT = auth.user_id()
    OR auth.user_role() = 'ADMIN'
  );

CREATE POLICY "faculty_profiles_update_own" ON "FacultyProfile"
  FOR UPDATE USING (
    "userId"::TEXT = auth.user_id()
    OR auth.user_role() = 'ADMIN'
  );

-- ============================================
-- ENROLLMENTS
-- ============================================

CREATE POLICY "enrollments_select" ON "Enrollment"
  FOR SELECT USING (
    "userId"::TEXT = auth.user_id()
    OR auth.user_role() = 'ADMIN'
    OR auth.user_role() = 'FACULTY'
  );

CREATE POLICY "enrollments_insert" ON "Enrollment"
  FOR INSERT WITH CHECK (
    "userId"::TEXT = auth.user_id()
    OR auth.user_role() = 'ADMIN'
  );

-- ============================================
-- ATTENDANCE SESSIONS
-- ============================================

CREATE POLICY "attendance_sessions_select" ON "AttendanceSession"
  FOR SELECT USING (
    -- Faculty can see their own sessions
    "facultyId"::TEXT = auth.user_id()
    OR auth.user_role() = 'ADMIN'
    OR (auth.user_role() = 'STUDENT' AND "collegeId" = auth.user_college())
  );

CREATE POLICY "attendance_sessions_insert" ON "AttendanceSession"
  FOR INSERT WITH CHECK (
    "facultyId"::TEXT = auth.user_id()
    OR auth.user_role() = 'ADMIN'
  );

CREATE POLICY "attendance_sessions_update" ON "AttendanceSession"
  FOR UPDATE USING (
    "facultyId"::TEXT = auth.user_id()
    OR auth.user_role() = 'ADMIN'
  );

-- ============================================
-- ATTENDANCE RECORDS
-- ============================================

CREATE POLICY "attendance_select" ON "Attendance"
  FOR SELECT USING (
    -- Students can see their own attendance
    "userId"::TEXT = auth.user_id()
    -- Faculty can see attendance they took
    OR auth.user_role() = 'FACULTY'
    -- Admins can see all
    OR auth.user_role() = 'ADMIN'
  );

CREATE POLICY "attendance_insert" ON "Attendance"
  FOR INSERT WITH CHECK (
    auth.user_role() = 'FACULTY'
    OR auth.user_role() = 'ADMIN'
  );

CREATE POLICY "attendance_update" ON "Attendance"
  FOR UPDATE USING (
    auth.user_role() = 'FACULTY'
    OR auth.user_role() = 'ADMIN'
  );

-- ============================================
-- NOTICES (Public read for college members)
-- ============================================

CREATE POLICY "notices_select" ON "Notice"
  FOR SELECT USING (
    "collegeId" = auth.user_college()
    OR auth.user_role() = 'ADMIN'
    OR "collegeId" IS NULL
  );

CREATE POLICY "notices_insert" ON "Notice"
  FOR INSERT WITH CHECK (
    auth.user_role() = 'ADMIN'
    OR auth.user_role() = 'FACULTY'
  );

CREATE POLICY "notices_update" ON "Notice"
  FOR UPDATE USING (
    auth.user_role() = 'ADMIN'
  );

-- ============================================
-- EVENTS (Public read for college members)
-- ============================================

CREATE POLICY "events_select" ON "Event"
  FOR SELECT USING (
    "collegeId" = auth.user_college()
    OR auth.user_role() = 'ADMIN'
    OR "collegeId" IS NULL
  );

CREATE POLICY "events_insert" ON "Event"
  FOR INSERT WITH CHECK (
    auth.user_role() = 'ADMIN'
    OR auth.user_role() = 'FACULTY'
  );

CREATE POLICY "events_update" ON "Event"
  FOR UPDATE USING (
    auth.user_role() = 'ADMIN'
  );

-- ============================================
-- OPPORTUNITIES (Public read)
-- ============================================

CREATE POLICY "opportunities_select" ON "Opportunity"
  FOR SELECT USING (true);

CREATE POLICY "opportunities_insert" ON "Opportunity"
  FOR INSERT WITH CHECK (
    auth.user_role() = 'ADMIN'
    OR auth.user_role() = 'FACULTY'
  );

-- ============================================
-- APPLICATIONS (Students see own, Faculty/Admin see all)
-- ============================================

CREATE POLICY "applications_select" ON "Application"
  FOR SELECT USING (
    "userId"::TEXT = auth.user_id()
    OR auth.user_role() = 'ADMIN'
    OR auth.user_role() = 'FACULTY'
  );

CREATE POLICY "applications_insert" ON "Application"
  FOR INSERT WITH CHECK (
    "userId"::TEXT = auth.user_id()
  );

-- ============================================
-- MESSAGES (Private between users)
-- ============================================

CREATE POLICY "messages_select" ON "Message"
  FOR SELECT USING (
    "senderId"::TEXT = auth.user_id()
    OR "receiverId"::TEXT = auth.user_id()
    OR auth.user_role() = 'ADMIN'
  );

CREATE POLICY "messages_insert" ON "Message"
  FOR INSERT WITH CHECK (
    "senderId"::TEXT = auth.user_id()
  );

-- ============================================
-- NOTIFICATIONS (Private per user)
-- ============================================

CREATE POLICY "notifications_select" ON "Notification"
  FOR SELECT USING (
    "userId"::TEXT = auth.user_id()
    OR auth.user_role() = 'ADMIN'
  );

CREATE POLICY "notifications_insert" ON "Notification"
  FOR INSERT WITH CHECK (
    auth.user_role() = 'ADMIN'
  );

-- ============================================
-- ASSIGNMENTS (Students see enrolled, Faculty manage)
-- ============================================

CREATE POLICY "assignments_select" ON "Assignment"
  FOR SELECT USING (
    auth.user_role() = 'ADMIN'
    OR auth.user_role() = 'FACULTY'
    OR auth.user_role() = 'STUDENT'
  );

CREATE POLICY "assignments_insert" ON "Assignment"
  FOR INSERT WITH CHECK (
    auth.user_role() = 'FACULTY'
    OR auth.user_role() = 'ADMIN'
  );

CREATE POLICY "assignments_update" ON "Assignment"
  FOR UPDATE USING (
    auth.user_role() = 'FACULTY'
    OR auth.user_role() = 'ADMIN'
  );

-- ============================================
-- EXAMS (Public read, Admin/Faculty manage)
-- ============================================

CREATE POLICY "exams_select" ON "Exam"
  FOR SELECT USING (true);

CREATE POLICY "exams_insert" ON "Exam"
  FOR INSERT WITH CHECK (
    auth.user_role() = 'ADMIN'
    OR auth.user_role() = 'FACULTY'
  );

-- ============================================
-- RESUMES (Students see own, Admin/Faculty see all)
-- ============================================

CREATE POLICY "resumes_select" ON "Resume"
  FOR SELECT USING (
    "userId"::TEXT = auth.user_id()
    OR auth.user_role() = 'ADMIN'
    OR auth.user_role() = 'FACULTY'
  );

CREATE POLICY "resumes_insert" ON "Resume"
  FOR INSERT WITH CHECK (
    "userId"::TEXT = auth.user_id()
  );

CREATE POLICY "resumes_update" ON "Resume"
  FOR UPDATE USING (
    "userId"::TEXT = auth.user_id()
    OR auth.user_role() = 'ADMIN'
  );

-- ============================================
-- PUSH SUBSCRIPTIONS (Private per user)
-- ============================================

CREATE POLICY "push_select" ON "PushSubscription"
  FOR SELECT USING (
    "userId"::TEXT = auth.user_id()
    OR auth.user_role() = 'ADMIN'
  );

CREATE POLICY "push_insert" ON "PushSubscription"
  FOR INSERT WITH CHECK (
    "userId"::TEXT = auth.user_id()
  );

CREATE POLICY "push_delete" ON "PushSubscription"
  FOR DELETE USING (
    "userId"::TEXT = auth.user_id()
  );

-- ============================================
-- USER PREFERENCES (Private per user)
-- ============================================

CREATE POLICY "preferences_select" ON "UserPreference"
  FOR SELECT USING (
    "userId"::TEXT = auth.user_id()
  );

CREATE POLICY "preferences_insert" ON "UserPreference"
  FOR INSERT WITH CHECK (
    "userId"::TEXT = auth.user_id()
  );

CREATE POLICY "preferences_update" ON "UserPreference"
  FOR UPDATE USING (
    "userId"::TEXT = auth.user_id()
  );

-- ============================================
-- TASKS (Students see own, Faculty see assigned)
-- ============================================

CREATE POLICY "tasks_select" ON "Task"
  FOR SELECT USING (
    "userId"::TEXT = auth.user_id()
    OR auth.user_role() = 'ADMIN'
  );

CREATE POLICY "tasks_insert" ON "Task"
  FOR INSERT WITH CHECK (
    "userId"::TEXT = auth.user_id()
  );

CREATE POLICY "tasks_update" ON "Task"
  FOR UPDATE USING (
    "userId"::TEXT = auth.user_id()
    OR auth.user_role() = 'ADMIN'
  );

-- ============================================
-- SUPPORT TICKETS
-- ============================================

CREATE POLICY "tickets_select" ON "SupportTicket"
  FOR SELECT USING (
    "userId"::TEXT = auth.user_id()
    OR auth.user_role() = 'ADMIN'
  );

CREATE POLICY "tickets_insert" ON "SupportTicket"
  FOR INSERT WITH CHECK (
    "userId"::TEXT = auth.user_id()
  );

CREATE POLICY "tickets_update" ON "SupportTicket"
  FOR UPDATE USING (
    auth.user_role() = 'ADMIN'
  );

-- ============================================
-- AI PLANS (Private per user)
-- ============================================

CREATE POLICY "ai_plans_select" ON "AIPlan"
  FOR SELECT USING (
    "userId"::TEXT = auth.user_id()
    OR auth.user_role() = 'ADMIN'
  );

CREATE POLICY "ai_plans_insert" ON "AIPlan"
  FOR INSERT WITH CHECK (
    "userId"::TEXT = auth.user_id()
  );

-- ============================================
-- CLUBS (Public read, Admin manage)
-- ============================================

CREATE POLICY "clubs_select" ON "Club"
  FOR SELECT USING (true);

CREATE POLICY "clubs_insert" ON "Club"
  FOR INSERT WITH CHECK (
    auth.user_role() = 'ADMIN'
  );

-- ============================================
-- TIMETABLE SLOTS
-- ============================================

CREATE POLICY "timetable_select" ON "TimetableSlot"
  FOR SELECT USING (
    auth.user_role() = 'ADMIN'
    OR auth.user_role() = 'FACULTY'
    OR auth.user_role() = 'STUDENT'
  );

CREATE POLICY "timetable_insert" ON "TimetableSlot"
  FOR INSERT WITH CHECK (
    auth.user_role() = 'ADMIN'
    OR auth.user_role() = 'FACULTY'
  );

CREATE POLICY "timetable_update" ON "TimetableSlot"
  FOR UPDATE USING (
    auth.user_role() = 'ADMIN'
    OR auth.user_role() = 'FACULTY'
  );

-- ============================================
-- DONE! All tables have RLS enabled
-- ============================================
