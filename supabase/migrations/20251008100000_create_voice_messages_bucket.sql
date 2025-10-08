-- Create voicemail storage bucket for voice message functionality

-- Create the voicemail bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('voicemail', 'voicemail', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Set up storage policies for voicemail bucket

-- Allow public read access to voicemails (for playback)
CREATE POLICY IF NOT EXISTS "Voicemails are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'voicemail');

-- Allow authenticated users to upload voicemails
CREATE POLICY IF NOT EXISTS "Authenticated users can upload voicemails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voicemail' AND
  auth.role() = 'authenticated'
);

-- Allow users to update their own uploaded voicemails
CREATE POLICY IF NOT EXISTS "Users can update their own voicemails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'voicemail' AND
  auth.role() = 'authenticated'
);

-- Allow users to delete their own uploaded voicemails
CREATE POLICY IF NOT EXISTS "Users can delete their own voicemails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'voicemail' AND
  auth.role() = 'authenticated'
);
