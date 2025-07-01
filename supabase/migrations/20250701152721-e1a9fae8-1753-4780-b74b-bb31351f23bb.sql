
-- Update the RLS policy for students to view course content
-- The current policy is too restrictive and may be causing issues
DROP POLICY IF EXISTS "Students can view purchased course content" ON public.course_content;

CREATE POLICY "Students can view purchased course content" 
  ON public.course_content 
  FOR SELECT 
  USING (
    -- Allow if content is free
    is_free = true 
    OR 
    -- Allow if user has purchased the course
    EXISTS (
      SELECT 1 FROM public.course_purchases 
      WHERE course_purchases.course_id = course_content.course_id 
      AND course_purchases.user_id = auth.uid()
      AND course_purchases.payment_status = 'completed'
    )
  );
