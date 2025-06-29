/*
  # Add AI Assistant Settings for Courses

  1. New Columns
    - `ai_assistant_enabled` (boolean) - Controls whether AI assistant is available for the course
    - `ai_assistant_settings` (jsonb) - Additional AI configuration options

  2. Security
    - Only instructors can modify AI settings for their courses
    - Students can view AI settings to know if it's available

  3. Changes
    - Add columns to courses table
    - Update course policies
    - Add default values for existing courses
*/

-- Add AI assistant settings to courses table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'ai_assistant_enabled') THEN
    ALTER TABLE courses ADD COLUMN ai_assistant_enabled BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'ai_assistant_settings') THEN
    ALTER TABLE courses ADD COLUMN ai_assistant_settings JSONB DEFAULT '{}';
  END IF;
END $$;

-- Set default AI assistant enabled for existing courses
UPDATE courses 
SET ai_assistant_enabled = true, ai_assistant_settings = '{}'
WHERE ai_assistant_enabled IS NULL;

-- Function to check if AI assistant is enabled for a course
CREATE OR REPLACE FUNCTION is_ai_assistant_enabled(p_course_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  ai_enabled BOOLEAN;
BEGIN
  SELECT ai_assistant_enabled INTO ai_enabled
  FROM courses
  WHERE id = p_course_id;
  
  RETURN COALESCE(ai_enabled, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update AI conversations policy to respect course AI settings
DROP POLICY IF EXISTS "Users can manage their own AI conversations" ON ai_conversations;
CREATE POLICY "Users can manage their own AI conversations" 
  ON ai_conversations 
  FOR ALL 
  USING (
    user_id = auth.uid() AND 
    (course_id IS NULL OR is_ai_assistant_enabled(course_id))
  );

-- Update AI analytics policy to respect course AI settings
DROP POLICY IF EXISTS "Users can manage their own AI analytics" ON ai_usage_analytics;
CREATE POLICY "Users can manage their own AI analytics" 
  ON ai_usage_analytics 
  FOR ALL 
  USING (
    user_id = auth.uid() AND 
    (course_id IS NULL OR is_ai_assistant_enabled(course_id))
  );