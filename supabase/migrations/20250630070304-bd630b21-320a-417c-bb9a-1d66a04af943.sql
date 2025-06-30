
-- Create custom_pages table for the page manager
CREATE TABLE public.custom_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT DEFAULT '',
  meta_description TEXT DEFAULT '',
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site_settings table for site customization
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  primary_color TEXT DEFAULT '#2563eb',
  secondary_color TEXT DEFAULT '#3b82f6',
  logo_url TEXT DEFAULT '',
  site_name TEXT DEFAULT 'LearnHub',
  favicon_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for custom_pages
ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage custom pages
CREATE POLICY "Admins can manage custom pages" 
  ON public.custom_pages 
  FOR ALL 
  USING (user_has_permission(auth.uid(), 'manage_platform_settings'));

-- Allow everyone to read published pages
CREATE POLICY "Everyone can read published pages" 
  ON public.custom_pages 
  FOR SELECT 
  USING (is_published = true);

-- Add RLS policies for site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage site settings
CREATE POLICY "Admins can manage site settings" 
  ON public.site_settings 
  FOR ALL 
  USING (user_has_permission(auth.uid(), 'manage_platform_settings'));

-- Allow everyone to read site settings
CREATE POLICY "Everyone can read site settings" 
  ON public.site_settings 
  FOR SELECT 
  TO public;

-- Create storage bucket for site assets (logos, favicons)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('site-assets', 'site-assets', true);

-- Allow admins to upload to site-assets bucket
CREATE POLICY "Admins can upload site assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'site-assets' 
  AND user_has_permission(auth.uid(), 'manage_platform_settings')
);

-- Allow admins to update site assets
CREATE POLICY "Admins can update site assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'site-assets' 
  AND user_has_permission(auth.uid(), 'manage_platform_settings')
);

-- Allow admins to delete site assets
CREATE POLICY "Admins can delete site assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'site-assets' 
  AND user_has_permission(auth.uid(), 'manage_platform_settings')
);

-- Allow public access to view site assets
CREATE POLICY "Public can view site assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'site-assets');
