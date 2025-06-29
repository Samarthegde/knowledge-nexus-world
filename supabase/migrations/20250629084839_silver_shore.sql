/*
  # Enhanced Features Migration - Fixed

  1. New Tables
    - `student_progress` - Detailed progress tracking for each content item
    - `certificate_templates` - Custom certificate templates for instructors
  
  2. Enhanced Tables
    - Add template and data fields to `certificates`
    - Add revenue tracking to `course_purchases`
  
  3. Security
    - Enable RLS on new tables
    - Add comprehensive policies for data access
  
  4. Analytics
    - Create instructor analytics view
    - Create course progress analytics view
  
  5. Automation
    - Auto-calculate instructor revenue
    - Auto-issue certificates on completion
    - Update timestamps automatically
*/

-- Create student_progress table for detailed tracking
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

-- Enhanced certificate templates
CREATE TABLE IF NOT EXISTS certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  html_content TEXT NOT NULL,
  css_styles TEXT,
  instructor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add more fields to certificates table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'template_id') THEN
    ALTER TABLE certificates ADD COLUMN template_id UUID REFERENCES certificate_templates(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'certificate_data') THEN
    ALTER TABLE certificates ADD COLUMN certificate_data JSONB;
  END IF;
END $$;

-- Add revenue tracking fields to course_purchases
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_purchases' AND column_name = 'instructor_revenue') THEN
    ALTER TABLE course_purchases ADD COLUMN instructor_revenue DECIMAL(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_purchases' AND column_name = 'platform_fee') THEN
    ALTER TABLE course_purchases ADD COLUMN platform_fee DECIMAL(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_purchases' AND column_name = 'payout_processed') THEN
    ALTER TABLE course_purchases ADD COLUMN payout_processed BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_purchases' AND column_name = 'payout_date') THEN
    ALTER TABLE course_purchases ADD COLUMN payout_date TIMESTAMPTZ;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Students can manage their own progress" ON student_progress;
DROP POLICY IF EXISTS "Instructors can view progress for their courses" ON student_progress;
DROP POLICY IF EXISTS "Instructors can manage their certificate templates" ON certificate_templates;
DROP POLICY IF EXISTS "Anyone can view default templates" ON certificate_templates;

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

-- RLS Policies for certificate_templates
CREATE POLICY "Instructors can manage their certificate templates" 
  ON certificate_templates 
  FOR ALL 
  USING (instructor_id = auth.uid());

CREATE POLICY "Anyone can view default templates" 
  ON certificate_templates 
  FOR SELECT 
  USING (is_default = true);

-- Function to update student_progress updated_at
CREATE OR REPLACE FUNCTION update_student_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for student_progress updated_at
DROP TRIGGER IF EXISTS update_student_progress_updated_at ON student_progress;
CREATE TRIGGER update_student_progress_updated_at
  BEFORE UPDATE ON student_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_student_progress_updated_at();

-- Function to calculate instructor revenue (90% of course price)
CREATE OR REPLACE FUNCTION calculate_instructor_revenue()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    NEW.instructor_revenue := NEW.amount * 0.90; -- 90% to instructor
    NEW.platform_fee := NEW.amount * 0.10; -- 10% platform fee
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate revenue on payment completion
DROP TRIGGER IF EXISTS calculate_instructor_revenue_trigger ON course_purchases;
CREATE TRIGGER calculate_instructor_revenue_trigger
  BEFORE UPDATE ON course_purchases
  FOR EACH ROW
  EXECUTE FUNCTION calculate_instructor_revenue();

-- Function to auto-issue certificates with enhanced data
CREATE OR REPLACE FUNCTION enhanced_check_course_completion()
RETURNS TRIGGER AS $$
DECLARE
  course_record RECORD;
  total_content INTEGER;
  completed_content INTEGER;
  completion_percentage DECIMAL;
  default_template_id UUID;
BEGIN
  -- Get course information
  SELECT c.* INTO course_record
  FROM courses c
  WHERE c.id = NEW.course_id;

  IF course_record IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate completion percentage
  SELECT COUNT(*) INTO total_content
  FROM course_content
  WHERE course_id = course_record.id;

  SELECT COUNT(*) INTO completed_content
  FROM student_progress sp
  WHERE sp.course_id = course_record.id
  AND sp.user_id = NEW.user_id
  AND sp.completed_at IS NOT NULL;

  completion_percentage := (completed_content::DECIMAL / total_content::DECIMAL) * 100;

  -- Issue certificate if 100% complete and not already issued
  IF completion_percentage >= 100 THEN
    -- Get default template or instructor's template
    SELECT id INTO default_template_id
    FROM certificate_templates
    WHERE (instructor_id = course_record.instructor_id OR is_default = true)
    ORDER BY instructor_id = course_record.instructor_id DESC, is_default DESC
    LIMIT 1;

    INSERT INTO certificates (course_id, student_id, template_id, certificate_data)
    SELECT 
      course_record.id, 
      NEW.user_id,
      default_template_id,
      jsonb_build_object(
        'completion_date', NOW(),
        'completion_percentage', completion_percentage,
        'total_time_spent', (
          SELECT SUM(time_spent_seconds) 
          FROM student_progress 
          WHERE course_id = course_record.id AND user_id = NEW.user_id
        )
      )
    WHERE NOT EXISTS (
      SELECT 1 FROM certificates
      WHERE course_id = course_record.id
      AND student_id = NEW.user_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the certificate trigger to use enhanced function
DROP TRIGGER IF EXISTS auto_certificate_trigger ON lesson_progress;
DROP TRIGGER IF EXISTS enhanced_auto_certificate_trigger ON student_progress;
CREATE TRIGGER enhanced_auto_certificate_trigger
  AFTER INSERT OR UPDATE ON student_progress
  FOR EACH ROW
  WHEN (NEW.completed_at IS NOT NULL)
  EXECUTE FUNCTION enhanced_check_course_completion();

-- Create instructor analytics view
CREATE OR REPLACE VIEW instructor_analytics AS
SELECT 
  c.instructor_id,
  c.id as course_id,
  c.title as course_title,
  COUNT(DISTINCT cp.user_id) as total_students,
  COUNT(DISTINCT CASE WHEN cp.payment_status = 'completed' THEN cp.user_id END) as paid_students,
  SUM(CASE WHEN cp.payment_status = 'completed' THEN cp.amount ELSE 0 END) as total_revenue,
  SUM(CASE WHEN cp.payment_status = 'completed' THEN cp.instructor_revenue ELSE 0 END) as instructor_revenue,
  AVG(cr.rating) as average_rating,
  COUNT(cr.rating) as rating_count,
  COUNT(DISTINCT cert.student_id) as certificates_issued
FROM courses c
LEFT JOIN course_purchases cp ON c.id = cp.course_id
LEFT JOIN course_ratings cr ON c.id = cr.course_id
LEFT JOIN certificates cert ON c.id = cert.course_id
GROUP BY c.instructor_id, c.id, c.title;

-- Create course progress analytics view
CREATE OR REPLACE VIEW course_progress_analytics AS
SELECT 
  sp.course_id,
  sp.user_id,
  COUNT(sp.content_id) as total_content_accessed,
  COUNT(CASE WHEN sp.completed_at IS NOT NULL THEN 1 END) as completed_content,
  AVG(sp.progress_percentage) as average_progress,
  SUM(sp.time_spent_seconds) as total_time_spent,
  MAX(sp.updated_at) as last_activity
FROM student_progress sp
GROUP BY sp.course_id, sp.user_id;

-- Insert default certificate template
INSERT INTO certificate_templates (name, html_content, css_styles, is_default) VALUES (
  'Default Certificate',
  '<div class="certificate">
    <h1>Certificate of Completion</h1>
    <p>This is to certify that</p>
    <h2>{{student_name}}</h2>
    <p>has successfully completed the course</p>
    <h3>{{course_title}}</h3>
    <p>on {{completion_date}}</p>
    <div class="signature">
      <p>{{instructor_name}}</p>
      <p>Course Instructor</p>
    </div>
  </div>',
  '.certificate { 
    text-align: center; 
    padding: 40px; 
    border: 2px solid #gold; 
    font-family: serif; 
  }
  .certificate h1 { 
    color: #1a365d; 
    margin-bottom: 20px; 
  }
  .certificate h2 { 
    color: #2d3748; 
    border-bottom: 1px solid #ccc; 
    padding-bottom: 10px; 
  }
  .signature { 
    margin-top: 40px; 
  }',
  true
) ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_course_content_section_id ON course_content(section_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_course_user ON student_progress(course_id, user_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_user_content ON student_progress(user_id, content_id);
CREATE INDEX IF NOT EXISTS idx_course_purchases_course_status ON course_purchases(course_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_certificates_course_student ON certificates(course_id, student_id);
CREATE INDEX IF NOT EXISTS idx_certificate_templates_instructor ON certificate_templates(instructor_id);

-- Function to check if content is unlocked for a user
CREATE OR REPLACE FUNCTION is_content_unlocked(
  p_content_id UUID,
  p_user_id UUID,
  p_course_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  schedule_record RECORD;
  enrollment_date TIMESTAMPTZ;
  prerequisite_completed BOOLEAN;
BEGIN
  -- Check if there's a schedule for this content
  SELECT * INTO schedule_record
  FROM content_schedule
  WHERE content_id = p_content_id;

  -- If no schedule, content is immediately available
  IF schedule_record IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Get user's enrollment date
  SELECT purchased_at INTO enrollment_date
  FROM course_purchases
  WHERE course_id = p_course_id 
  AND user_id = p_user_id 
  AND payment_status = 'completed'
  ORDER BY purchased_at ASC
  LIMIT 1;

  -- If not enrolled, check if it's a free course
  IF enrollment_date IS NULL THEN
    SELECT created_at INTO enrollment_date
    FROM courses
    WHERE id = p_course_id AND price = 0;
    
    IF enrollment_date IS NULL THEN
      RETURN FALSE;
    END IF;
  END IF;

  -- Check time-based unlock
  IF schedule_record.unlock_after_days > 0 THEN
    IF NOW() < enrollment_date + INTERVAL '1 day' * schedule_record.unlock_after_days THEN
      RETURN FALSE;
    END IF;
  END IF;

  -- Check prerequisite content completion
  IF schedule_record.unlock_after_content_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM student_progress
      WHERE user_id = p_user_id
      AND content_id = schedule_record.unlock_after_content_id
      AND completed_at IS NOT NULL
    ) INTO prerequisite_completed;

    IF NOT prerequisite_completed THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unlocked content for a user
CREATE OR REPLACE FUNCTION get_unlocked_content(
  p_user_id UUID,
  p_course_id UUID
) RETURNS TABLE (
  content_id UUID,
  title TEXT,
  content_type TEXT,
  order_index INTEGER,
  is_unlocked BOOLEAN,
  unlock_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cc.id as content_id,
    cc.title,
    cc.content_type,
    cc.order_index,
    is_content_unlocked(cc.id, p_user_id, p_course_id) as is_unlocked,
    CASE 
      WHEN cs.unlock_after_days > 0 THEN 
        (SELECT purchased_at + INTERVAL '1 day' * cs.unlock_after_days 
         FROM course_purchases 
         WHERE course_id = p_course_id AND user_id = p_user_id AND payment_status = 'completed'
         ORDER BY purchased_at ASC LIMIT 1)
      ELSE NULL
    END as unlock_date
  FROM course_content cc
  LEFT JOIN content_schedule cs ON cc.id = cs.content_id
  WHERE cc.course_id = p_course_id
  ORDER BY cc.order_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update course_content RLS policy to respect drip content
DROP POLICY IF EXISTS "Students can view purchased course content" ON course_content;
CREATE POLICY "Students can view purchased course content" 
  ON course_content 
  FOR SELECT 
  USING (
    is_free = true OR 
    (
      EXISTS (
        SELECT 1 FROM course_purchases 
        WHERE course_purchases.course_id = course_content.course_id 
        AND course_purchases.user_id = auth.uid() 
        AND course_purchases.payment_status = 'completed'
      ) AND 
      is_content_unlocked(course_content.id, auth.uid(), course_content.course_id)
    )
  );