
-- Create table for quizzes (if not exists)
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,
  max_attempts INTEGER DEFAULT 3,
  time_limit_minutes INTEGER, -- NULL means no time limit
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for quiz questions (if not exists)
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'short_answer')),
  correct_answer TEXT, -- For short answer questions
  options JSONB, -- For multiple choice: [{"text": "Option A", "is_correct": true}, ...]
  points INTEGER DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for quiz attempts (if not exists)
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  answers JSONB NOT NULL, -- {"question_id": "answer"}
  score INTEGER,
  max_score INTEGER,
  passed BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  graded_at TIMESTAMP WITH TIME ZONE
);

-- Create table for content scheduling (drip content) - if not exists
CREATE TABLE IF NOT EXISTS public.content_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES public.course_content(id) ON DELETE CASCADE NOT NULL,
  unlock_after_days INTEGER DEFAULT 0, -- Days after enrollment
  unlock_after_content_id UUID REFERENCES public.course_content(id) ON DELETE SET NULL, -- Unlock after completing specific content
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for quizzes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quizzes' AND policyname = 'Instructors can manage their course quizzes') THEN
    ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Instructors can manage their course quizzes" 
      ON public.quizzes 
      FOR ALL 
      USING (
        EXISTS (
          SELECT 1 FROM public.courses 
          WHERE courses.id = quizzes.course_id 
          AND courses.instructor_id = auth.uid()
        )
      );

    CREATE POLICY "Students can view published quizzes of enrolled courses" 
      ON public.quizzes 
      FOR SELECT 
      USING (
        is_published = true AND
        EXISTS (
          SELECT 1 FROM public.course_purchases 
          WHERE course_purchases.course_id = quizzes.course_id 
          AND course_purchases.user_id = auth.uid()
          AND course_purchases.payment_status = 'completed'
        )
      );
  END IF;
END $$;

-- Add RLS policies for quiz questions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quiz_questions' AND policyname = 'Instructors can manage quiz questions') THEN
    ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Instructors can manage quiz questions" 
      ON public.quiz_questions 
      FOR ALL 
      USING (
        EXISTS (
          SELECT 1 FROM public.quizzes q
          JOIN public.courses c ON c.id = q.course_id
          WHERE q.id = quiz_questions.quiz_id 
          AND c.instructor_id = auth.uid()
        )
      );

    CREATE POLICY "Students can view quiz questions of enrolled courses" 
      ON public.quiz_questions 
      FOR SELECT 
      USING (
        EXISTS (
          SELECT 1 FROM public.quizzes q
          JOIN public.course_purchases cp ON cp.course_id = q.course_id
          WHERE q.id = quiz_questions.quiz_id 
          AND cp.user_id = auth.uid()
          AND cp.payment_status = 'completed'
          AND q.is_published = true
        )
      );
  END IF;
END $$;

-- Add RLS policies for quiz attempts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quiz_attempts' AND policyname = 'Students can manage their own quiz attempts') THEN
    ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Students can manage their own quiz attempts" 
      ON public.quiz_attempts 
      FOR ALL 
      USING (student_id = auth.uid());

    CREATE POLICY "Instructors can view quiz attempts for their courses" 
      ON public.quiz_attempts 
      FOR SELECT 
      USING (
        EXISTS (
          SELECT 1 FROM public.quizzes q
          JOIN public.courses c ON c.id = q.course_id
          WHERE q.id = quiz_attempts.quiz_id 
          AND c.instructor_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Add RLS policies for content schedule
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_schedule' AND policyname = 'Instructors can manage content schedule for their courses') THEN
    ALTER TABLE public.content_schedule ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Instructors can manage content schedule for their courses" 
      ON public.content_schedule 
      FOR ALL 
      USING (
        EXISTS (
          SELECT 1 FROM public.courses 
          WHERE courses.id = content_schedule.course_id 
          AND courses.instructor_id = auth.uid()
        )
      );

    CREATE POLICY "Students can view content schedule of enrolled courses" 
      ON public.content_schedule 
      FOR SELECT 
      USING (
        EXISTS (
          SELECT 1 FROM public.course_purchases 
          WHERE course_purchases.course_id = content_schedule.course_id 
          AND course_purchases.user_id = auth.uid()
          AND course_purchases.payment_status = 'completed'
        )
      );
  END IF;
END $$;

-- Create function to auto-issue certificates on course completion
CREATE OR REPLACE FUNCTION check_course_completion()
RETURNS TRIGGER AS $$
DECLARE
  course_record RECORD;
  total_content INTEGER;
  completed_content INTEGER;
  completion_percentage DECIMAL;
BEGIN
  -- Get course information from lesson_progress
  SELECT c.* INTO course_record
  FROM courses c
  JOIN course_content cc ON cc.course_id = c.id
  WHERE cc.id = NEW.lesson_id;

  IF course_record IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate completion percentage
  SELECT COUNT(*) INTO total_content
  FROM course_content
  WHERE course_id = course_record.id;

  SELECT COUNT(*) INTO completed_content
  FROM lesson_progress lp
  JOIN course_content cc ON cc.id = lp.lesson_id
  WHERE cc.course_id = course_record.id
  AND lp.student_id = NEW.student_id
  AND lp.completed = true;

  completion_percentage := (completed_content::DECIMAL / total_content::DECIMAL) * 100;

  -- Issue certificate if 100% complete and not already issued
  IF completion_percentage >= 100 THEN
    INSERT INTO certificates (course_id, student_id)
    SELECT course_record.id, NEW.student_id
    WHERE NOT EXISTS (
      SELECT 1 FROM certificates
      WHERE course_id = course_record.id
      AND student_id = NEW.student_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-certificate issuance (drop first if exists)
DROP TRIGGER IF EXISTS auto_certificate_trigger ON lesson_progress;
CREATE TRIGGER auto_certificate_trigger
  AFTER UPDATE ON lesson_progress
  FOR EACH ROW
  WHEN (NEW.completed = true AND OLD.completed = false)
  EXECUTE FUNCTION check_course_completion();
