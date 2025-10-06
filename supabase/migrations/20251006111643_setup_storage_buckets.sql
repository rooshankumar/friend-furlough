-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('post_pic', 'post_pic', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_attachments', 'chat_attachments', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Set up storage policies for avatars bucket
CREATE POLICY IF NOT EXISTS "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY IF NOT EXISTS "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Set up storage policies for post_pic bucket
CREATE POLICY IF NOT EXISTS "Post images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'post_pic');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post_pic' AND
  auth.role() = 'authenticated'
);

-- Set up storage policies for chat_attachments bucket
CREATE POLICY IF NOT EXISTS "Users can view chat attachments they're part of"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat_attachments' AND
  auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat_attachments' AND
  auth.role() = 'authenticated'
);
