/*
  # Knowledge Nexus Phase 2: Instructor Experience

  1. Enhanced Progress Tracking
    - Update student_progress table with more detailed tracking
    - Add course completion tracking
    - Create progress analytics views

  2. Certificate System
    - Create certificate templates table
    - Add certificate generation triggers
    - Enable custom certificate designs

  3. Revenue Tracking
    - Add payout tracking to course_purchases
    - Create instructor revenue analytics
    - Add commission and fee tracking

  4. Enhanced Analytics
    - Create views for instructor dashboards
    - Add engagement metrics
    - Course performance tracking
*/

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
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES certificate_templates(id);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certificate_data JSONB; -- Store dynamic data like completion date, grade, etc.

-- Add revenue tracking fields to course_purchases
ALTER TABLE course_purchases ADD COLUMN IF NOT EXISTS instructor_revenue DECIMAL(10,2);
ALTER TABLE course_purchases ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2);
ALTER TABLE course_purchases ADD COLUMN IF NOT EXISTS payout_processed BOOLEAN DEFAULT false;
ALTER TABLE course_purchases ADD COLUMN IF NOT EXISTS payout_date TIMESTAMPTZ;

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

-- Enable RLS on new tables
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for certificate_templates
CREATE POLICY "Instructors can manage their certificate templates" 
  ON certificate_templates 
  FOR ALL 
  USING (instructor_id = auth.uid());

CREATE POLICY "Anyone can view default templates" 
  ON certificate_templates 
  FOR SELECT 
  USING (is_default = true);

-- Function to calculate instructor revenue (90% of course price)
CREATE OR REPLACE FUNCTION calculate_instructor_revenue()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
    NEW.instructor_revenue := NEW.amount * 0.90; -- 90% to instructor
    NEW.platform_fee := NEW.amount * 0.10; -- 10% platform fee
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate revenue on payment completion
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
DROP TRIGGER IF EXISTS auto_certificate_trigger ON student_progress;
CREATE TRIGGER enhanced_auto_certificate_trigger
  AFTER INSERT OR UPDATE ON student_progress
  FOR EACH ROW
  WHEN (NEW.completed_at IS NOT NULL)
  EXECUTE FUNCTION enhanced_check_course_completion();

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
CREATE INDEX IF NOT EXISTS idx_course_purchases_instructor_revenue ON course_purchases(instructor_id, payment_status) 
WHERE payment_status = 'completed';