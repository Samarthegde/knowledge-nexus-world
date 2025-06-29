-- Create storage bucket for course media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-media', 'course-media', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for course media
CREATE POLICY "Anyone can view course media" ON storage.objects
  FOR SELECT USING (bucket_id = 'course-media');

CREATE POLICY "Authenticated users can upload course media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'course-media' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own course media" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'course-media' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own course media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'course-media' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );