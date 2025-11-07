
-- Ensure chat-attachments bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  true,
  10485760, -- 10MB
  ARRAY['image/*', 'video/*', 'audio/*']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/*', 'video/*', 'audio/*'];

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat attachments" ON storage.objects;

-- Allow authenticated users to upload
CREATE POLICY "Users can upload chat attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

-- Allow anyone to view (public bucket)
CREATE POLICY "Users can view chat attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-attachments');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own chat attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
