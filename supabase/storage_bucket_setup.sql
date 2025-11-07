-- ============================================
-- Storage Bucket Management for Chat Attachments
-- ============================================

-- STEP 1: Delete existing chat-attachments bucket (if needed)
-- WARNING: This will delete ALL files in the bucket!
-- Run this only if you want to start fresh

-- Delete all files in the bucket first (optional - for cleanup)
-- Note: You may need to do this through Supabase Dashboard > Storage > chat-attachments > Delete all files

-- Delete the bucket
DELETE FROM storage.buckets WHERE id = 'chat-attachments';

-- ============================================

-- STEP 2: Create new chat-attachments bucket with proper configuration
-- This creates a PUBLIC bucket (files are accessible via public URLs)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  true,  -- Public bucket (files accessible via public URLs)
  20971520,  -- 20MB file size limit (20 * 1024 * 1024 bytes)
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
);

-- ============================================

-- STEP 3: Set up RLS (Row Level Security) policies for the bucket
-- These policies control who can upload, view, and delete files

-- Policy 1: Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
);

-- Policy 2: Allow public read access (anyone can view files via public URL)
CREATE POLICY "Public read access for chat attachments"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'chat-attachments'
);

-- Policy 3: Allow users to delete their own uploaded files
-- Files are stored in folders by conversation ID, so we check if user is a participant
CREATE POLICY "Users can delete their conversation attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (
    -- Check if user is a participant in the conversation
    -- File path format: conversationId/timestamp_filename.ext
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = (storage.foldername(name))[1]::uuid
      AND user_id = auth.uid()
    )
  )
);

-- Policy 4: Allow users to update their conversation attachments (optional)
CREATE POLICY "Users can update their conversation attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = (storage.foldername(name))[1]::uuid
      AND user_id = auth.uid()
    )
  )
);

-- ============================================

-- ALTERNATIVE: If you want to recreate the bucket with different settings
-- Run this as a single transaction:

BEGIN;

-- Delete old bucket
DELETE FROM storage.buckets WHERE id = 'chat-attachments';

-- Create new bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  true,
  20971520,  -- 20MB
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/quicktime', 'video/webm',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
);

-- Add RLS policies
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Public read access for chat attachments"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Users can delete their conversation attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = (storage.foldername(name))[1]::uuid
    AND user_id = auth.uid()
  )
);

COMMIT;

-- ============================================

-- VERIFICATION QUERIES
-- Run these to verify the bucket was created correctly

-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'chat-attachments';

-- Check bucket policies
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%chat%';

-- Check storage objects (files)
SELECT * FROM storage.objects 
WHERE bucket_id = 'chat-attachments'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================

-- TROUBLESHOOTING: If uploads are still timing out

-- 1. Check if bucket exists and is public
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'chat-attachments';

-- 2. Check RLS policies are enabled
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%chat%';

-- 3. Test upload permissions for current user
-- (Run this while logged in as a test user)
SELECT 
  auth.uid() as current_user_id,
  EXISTS(
    SELECT 1 FROM conversation_participants 
    WHERE user_id = auth.uid()
  ) as is_participant_in_any_conversation;

-- ============================================

-- CLEANUP: Remove all files from bucket (use with caution!)
-- This deletes all file records but may not delete actual files
-- Better to use Supabase Dashboard for this

DELETE FROM storage.objects 
WHERE bucket_id = 'chat-attachments';

-- ============================================

-- NOTES:
-- 1. Run these commands in Supabase SQL Editor
-- 2. Make sure you're connected to the correct project
-- 3. Backup any important files before deleting the bucket
-- 4. After creating the bucket, test upload from the app
-- 5. Check Supabase Dashboard > Storage to verify bucket settings
