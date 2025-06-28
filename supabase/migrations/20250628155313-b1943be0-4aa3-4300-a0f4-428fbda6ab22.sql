
-- Add more specific permissions and update user roles
-- First, let's add more granular permission tracking

-- Create permissions enum
CREATE TYPE public.permission AS ENUM (
  -- Admin permissions
  'manage_users',
  'manage_platform_settings',
  'view_all_analytics',
  'manage_subscriptions',
  'moderate_content',
  
  -- Creator permissions
  'create_courses',
  'manage_own_courses',
  'view_student_progress',
  'grade_assignments',
  'issue_certificates',
  'manage_discussions',
  'view_own_revenue',
  'customize_landing_pages',
  
  -- Student permissions
  'enroll_courses',
  'access_content',
  'submit_assignments',
  'download_certificates',
  'participate_discussions',
  'rate_courses'
);

-- Create role permissions mapping table
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission permission NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role, permission)
);

-- Insert default permissions for each role
INSERT INTO public.role_permissions (role, permission) VALUES
-- Admin permissions
('admin', 'manage_users'),
('admin', 'manage_platform_settings'),
('admin', 'view_all_analytics'),
('admin', 'manage_subscriptions'),
('admin', 'moderate_content'),
('admin', 'create_courses'),
('admin', 'manage_own_courses'),
('admin', 'view_student_progress'),
('admin', 'grade_assignments'),
('admin', 'issue_certificates'),
('admin', 'manage_discussions'),
('admin', 'view_own_revenue'),
('admin', 'customize_landing_pages'),

-- Instructor/Creator permissions
('instructor', 'create_courses'),
('instructor', 'manage_own_courses'),
('instructor', 'view_student_progress'),
('instructor', 'grade_assignments'),
('instructor', 'issue_certificates'),
('instructor', 'manage_discussions'),
('instructor', 'view_own_revenue'),
('instructor', 'customize_landing_pages'),

-- Student permissions
('student', 'enroll_courses'),
('student', 'access_content'),
('student', 'submit_assignments'),
('student', 'download_certificates'),
('student', 'participate_discussions'),
('student', 'rate_courses');

-- Create function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(_user_id UUID, _permission permission)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id AND rp.permission = _permission
  )
$$;

-- Create assignments table for course assignments
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  module_id UUID REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  due_date TIMESTAMPTZ,
  max_score INTEGER DEFAULT 100,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create assignment submissions table
CREATE TABLE public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  file_urls TEXT[],
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  score INTEGER,
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES auth.users(id),
  UNIQUE(assignment_id, student_id)
);

-- Create certificates table
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  certificate_url TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, student_id)
);

-- Create course ratings table
CREATE TABLE public.course_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, student_id)
);

-- Create discussions table
CREATE TABLE public.discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for role_permissions (read-only for users)
CREATE POLICY "Anyone can view role permissions" ON public.role_permissions
  FOR SELECT USING (true);

-- RLS Policies for assignments
CREATE POLICY "Anyone can view assignments for published courses" ON public.assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = assignments.course_id 
      AND courses.is_published = true
    )
  );

CREATE POLICY "Instructors can manage their course assignments" ON public.assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = assignments.course_id 
      AND courses.instructor_id = auth.uid()
    )
  );

-- RLS Policies for assignment submissions
CREATE POLICY "Students can view their own submissions" ON public.assignment_submissions
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can create submissions" ON public.assignment_submissions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their ungraded submissions" ON public.assignment_submissions
  FOR UPDATE USING (auth.uid() = student_id AND score IS NULL);

CREATE POLICY "Instructors can view submissions for their courses" ON public.assignment_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.courses c ON a.course_id = c.id
      WHERE a.id = assignment_submissions.assignment_id 
      AND c.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can grade submissions" ON public.assignment_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.courses c ON a.course_id = c.id
      WHERE a.id = assignment_submissions.assignment_id 
      AND c.instructor_id = auth.uid()
    )
  );

-- RLS Policies for certificates
CREATE POLICY "Students can view their own certificates" ON public.certificates
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Instructors can issue certificates for their courses" ON public.certificates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = certificates.course_id 
      AND courses.instructor_id = auth.uid()
    )
  );

-- RLS Policies for course ratings
CREATE POLICY "Anyone can view course ratings" ON public.course_ratings
  FOR SELECT USING (true);

CREATE POLICY "Students can rate enrolled courses" ON public.course_ratings
  FOR INSERT WITH CHECK (
    auth.uid() = student_id AND
    EXISTS (
      SELECT 1 FROM public.enrollments 
      WHERE enrollments.course_id = course_ratings.course_id 
      AND enrollments.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can update their own ratings" ON public.course_ratings
  FOR UPDATE USING (auth.uid() = student_id);

-- RLS Policies for discussions
CREATE POLICY "Anyone can view discussions for published courses" ON public.discussions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = discussions.course_id 
      AND courses.is_published = true
    )
  );

CREATE POLICY "Enrolled students and instructors can create discussions" ON public.discussions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (
      EXISTS (
        SELECT 1 FROM public.enrollments 
        WHERE enrollments.course_id = discussions.course_id 
        AND enrollments.student_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.courses 
        WHERE courses.id = discussions.course_id 
        AND courses.instructor_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own discussions" ON public.discussions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own discussions" ON public.discussions
  FOR DELETE USING (auth.uid() = user_id);
