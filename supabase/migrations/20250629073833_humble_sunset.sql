/*
  # Knowledge Nexus Phase 1: Core Content & Learning

  1. New Tables
    - `sections` - Course sections/chapters for better content organization
    - Enhanced course content structure with section relationships
  
  2. Schema Updates
    - Add thumbnail_url to courses table
    - Add syllabus JSONB field to courses table
    - Add section_id to course_content table
  
  3. Security
    - Enable RLS on sections table
    - Add policies for section management
*/

-- Add thumbnail_url and syllabus to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS syllabus JSONB;

-- Create sections table for course organization
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add section_id to course_content table
ALTER TABLE course_content ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES sections(id) ON DELETE SET NULL;

-- Enable RLS on sections table
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sections
CREATE POLICY "Instructors can manage their course sections" 
  ON sections 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = sections.course_id 
      AND courses.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Students can view sections of enrolled courses" 
  ON sections 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      LEFT JOIN course_purchases cp ON cp.course_id = c.id
      WHERE c.id = sections.course_id 
      AND (
        c.price = 0 OR 
        (cp.user_id = auth.uid() AND cp.payment_status = 'completed')
      )
    )
  );

-- Create function to update sections updated_at
CREATE OR REPLACE FUNCTION update_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sections updated_at
CREATE TRIGGER update_sections_updated_at
  BEFORE UPDATE ON sections
  FOR EACH ROW
  EXECUTE FUNCTION update_sections_updated_at();

-- Create student progress tracking table
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES course_content(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_id)
);

-- Enable RLS on student_progress
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_progress
CREATE POLICY "Students can manage their own progress" 
  ON student_progress 
  FOR ALL 
  USING (user_id = auth.uid());

CREATE POLICY "Instructors can view progress for their courses" 
  ON student_progress 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = student_progress.course_id 
      AND courses.instructor_id = auth.uid()
    )
  );

-- Create function to update student_progress updated_at
CREATE OR REPLACE FUNCTION update_student_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for student_progress updated_at
CREATE TRIGGER update_student_progress_updated_at
  BEFORE UPDATE ON student_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_student_progress_updated_at();