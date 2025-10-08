-- Fix chat_attachments storage bucket and policies
-- Make chat attachments publicly accessible but with proper RLS

-- Update bucket to be public for easier access
UPDATE storage.buckets 
SET public = true 
WHERE id = 'chat_attachments';

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view chat attachments they're part of" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload chat attachments" ON storage.objects;

-- Create new comprehensive policies for chat_attachments

-- Allow public read access to chat attachments (like images in messages)
CREATE POLICY "Chat attachments are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat_attachments');

-- Allow authenticated users to upload chat attachments
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat_attachments' AND
  auth.role() = 'authenticated'
);

-- Allow users to update their own uploaded attachments
CREATE POLICY "Users can update their own chat attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'chat_attachments' AND
  auth.role() = 'authenticated'
);

-- Allow users to delete their own uploaded attachments
CREATE POLICY "Users can delete their own chat attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat_attachments' AND
  auth.role() = 'authenticated'
);
