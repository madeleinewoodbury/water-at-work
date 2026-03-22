-- Migration: Add avatar_url column and avatars storage bucket policies
-- Run this on an existing database that already has the schema applied.

-- 1. Add avatar_url to users table
--    Values: NULL (initials), 'gravatar', 'preset:{name}', or a Supabase Storage public URL
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Create the 'avatars' storage bucket in the Supabase Dashboard → Storage
--    Set the bucket to Public so avatar images are readable without auth.

-- 3. RLS policies for the 'avatars' bucket (run after creating the bucket)
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public avatar read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
