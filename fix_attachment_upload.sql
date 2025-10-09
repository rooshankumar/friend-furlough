-- Fix attachment upload issues
-- Run this in Supabase SQL Editor

-- 1. Ensure chat_attachments bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('chat_attachments', 'chat_attachments', true, 52428800, ARRAY['image/*', 'video/*', 'audio/*', 'application/pdf', 'text/*'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/*', 'video/*', 'audio/*', 'application/pdf', 'text/*'];

-- 2. Drop all existing conflicting policies
DROP POLICY IF EXISTS "Chat attachments are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can view chat attachments they're part of" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat attachments" ON storage.objects;

-- 3. Create simple, working policies for chat attachments
CREATE POLICY "chat_attachments_select_policy"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat_attachments');

CREATE POLICY "chat_attachments_insert_policy"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat_attachments' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "chat_attachments_update_policy"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'chat_attachments' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "chat_attachments_delete_policy"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat_attachments' AND
  auth.role() = 'authenticated'
);

-- 4. Test the bucket
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types 
FROM storage.buckets 
WHERE id = 'chat_attachments';

-- 5. Check policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%chat_attachments%';
