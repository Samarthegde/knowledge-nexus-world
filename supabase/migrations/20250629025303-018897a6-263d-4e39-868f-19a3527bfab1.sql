
-- Create table for course content (lessons/modules)
CREATE TABLE public.course_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'pdf', 'text')),
  content_url TEXT, -- For video/PDF URLs
  text_content TEXT, -- For text-based lessons
  order_index INTEGER NOT NULL DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  duration_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for course purchases/enrollments
CREATE TABLE public.course_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('free', 'paid')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  amount DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  stripe_session_id TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for course_content
ALTER TABLE public.course_content ENABLE ROW LEVEL SECURITY;

-- Instructors can manage their own course content
CREATE POLICY "Instructors can manage their course content" 
  ON public.course_content 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = course_content.course_id 
      AND courses.instructor_id = auth.uid()
    )
  );

-- Students can view content of courses they've purchased or free content
CREATE POLICY "Students can view purchased course content" 
  ON public.course_content 
  FOR SELECT 
  USING (
    is_free = true OR
    EXISTS (
      SELECT 1 FROM public.course_purchases 
      WHERE course_purchases.course_id = course_content.course_id 
      AND course_purchases.user_id = auth.uid()
      AND course_purchases.payment_status = 'completed'
    )
  );

-- Add RLS policies for course_purchases
ALTER TABLE public.course_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view their own purchases" 
  ON public.course_purchases 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Allow inserts for purchases (will be handled by edge functions)
CREATE POLICY "Allow purchase inserts" 
  ON public.course_purchases 
  FOR INSERT 
  WITH CHECK (true);

-- Instructors can view purchases of their courses
CREATE POLICY "Instructors can view their course purchases" 
  ON public.course_purchases 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = course_purchases.course_id 
      AND courses.instructor_id = auth.uid()
    )
  );

-- Add trigger to update course content updated_at
CREATE OR REPLACE FUNCTION update_course_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_content_updated_at
  BEFORE UPDATE ON public.course_content
  FOR EACH ROW
  EXECUTE FUNCTION update_course_content_updated_at();
