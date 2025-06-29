/*
  # AI Learning Assistant Database Schema

  1. New Tables
    - `ai_conversations` - Store chat history between users and AI
    - `ai_usage_analytics` - Track AI usage patterns and effectiveness
    - `learning_preferences` - Store user preferences for AI personalization

  2. Security
    - Enable RLS on all new tables
    - Add policies for user data access and instructor course access
    - Create secure functions for AI operations

  3. Performance
    - Add indexes for efficient querying
    - Create analytics views for reporting
*/

-- AI Conversations table for storing chat history
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  response_time_ms INTEGER,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_comment TEXT
);

-- AI Usage Analytics for tracking effectiveness
CREATE TABLE IF NOT EXISTS ai_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  total_messages INTEGER DEFAULT 0,
  session_duration_minutes INTEGER DEFAULT 0,
  topics_discussed TEXT[],
  learning_outcomes_achieved TEXT[],
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_id)
);

-- Learning Preferences for AI personalization
CREATE TABLE IF NOT EXISTS learning_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  learning_style VARCHAR(50), -- visual, auditory, kinesthetic, reading
  explanation_preference VARCHAR(50), -- detailed, concise, examples, step-by-step
  interaction_style VARCHAR(50), -- formal, casual, encouraging, direct
  preferred_languages TEXT[] DEFAULT ARRAY['en'],
  difficulty_preference VARCHAR(20) DEFAULT 'adaptive', -- easy, medium, hard, adaptive
  ai_assistance_level VARCHAR(20) DEFAULT 'balanced', -- minimal, balanced, extensive
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_conversations
CREATE POLICY "Users can manage their own AI conversations" 
  ON ai_conversations 
  FOR ALL 
  USING (user_id = auth.uid());

CREATE POLICY "Instructors can view AI conversations for their courses" 
  ON ai_conversations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = ai_conversations.course_id 
      AND courses.instructor_id = auth.uid()
    )
  );

-- RLS Policies for ai_usage_analytics
CREATE POLICY "Users can manage their own AI analytics" 
  ON ai_usage_analytics 
  FOR ALL 
  USING (user_id = auth.uid());

CREATE POLICY "Instructors can view AI analytics for their courses" 
  ON ai_usage_analytics 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = ai_usage_analytics.course_id 
      AND courses.instructor_id = auth.uid()
    )
  );

-- RLS Policies for learning_preferences
CREATE POLICY "Users can manage their own learning preferences" 
  ON learning_preferences 
  FOR ALL 
  USING (user_id = auth.uid());

-- Function to update learning_preferences updated_at
CREATE OR REPLACE FUNCTION update_learning_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for learning_preferences updated_at
CREATE TRIGGER update_learning_preferences_updated_at
  BEFORE UPDATE ON learning_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_learning_preferences_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_course ON ai_conversations(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON ai_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_analytics_user_session ON ai_usage_analytics(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_learning_preferences_user ON learning_preferences(user_id);

-- Function to get AI conversation context for a user and course
CREATE OR REPLACE FUNCTION get_ai_conversation_context(
  p_user_id UUID,
  p_course_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  user_message TEXT,
  ai_response TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.user_message,
    ac.ai_response,
    ac.created_at
  FROM ai_conversations ac
  WHERE ac.user_id = p_user_id
    AND (p_course_id IS NULL OR ac.course_id = p_course_id)
  ORDER BY ac.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track AI usage analytics
CREATE OR REPLACE FUNCTION track_ai_usage(
  p_user_id UUID,
  p_course_id UUID,
  p_session_id UUID,
  p_message_count INTEGER DEFAULT 1
) RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_usage_analytics (
    user_id, 
    course_id, 
    session_id, 
    total_messages
  ) VALUES (
    p_user_id, 
    p_course_id, 
    p_session_id, 
    p_message_count
  )
  ON CONFLICT (user_id, session_id) 
  DO UPDATE SET 
    total_messages = ai_usage_analytics.total_messages + p_message_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for AI assistant analytics
CREATE OR REPLACE VIEW ai_assistant_analytics AS
SELECT 
  DATE_TRUNC('day', ac.created_at) as date,
  COUNT(*) as total_conversations,
  COUNT(DISTINCT ac.user_id) as unique_users,
  AVG(ac.response_time_ms) as avg_response_time,
  AVG(ac.feedback_rating) as avg_rating,
  COUNT(CASE WHEN ac.feedback_rating >= 4 THEN 1 END) as positive_feedback_count,
  ac.course_id,
  c.title as course_title
FROM ai_conversations ac
LEFT JOIN courses c ON ac.course_id = c.id
GROUP BY DATE_TRUNC('day', ac.created_at), ac.course_id, c.title
ORDER BY date DESC;