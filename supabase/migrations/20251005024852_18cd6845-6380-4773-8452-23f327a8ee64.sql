-- Fix infinite recursion in RLS policies by using security definer functions

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;

-- Create security definer function to check conversation membership
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = _conversation_id
      AND user_id = _user_id
  )
$$;

-- Create new policies using the security definer function
CREATE POLICY "Users can view conversation participants"
ON public.conversation_participants
FOR SELECT
USING (public.is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "Users can view their conversations"
ON public.conversations
FOR SELECT
USING (public.is_conversation_participant(id, auth.uid()));

-- Fix storage RLS for post_pic bucket
CREATE POLICY "Users can upload their own posts"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'post_pic' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Post images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'post_pic');

CREATE POLICY "Users can update their own posts"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'post_pic' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own posts"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'post_pic' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);