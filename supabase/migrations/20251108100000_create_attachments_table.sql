-- ============================================
-- ATTACHMENTS TABLE
-- ============================================
-- Dedicated table for chat attachments with metadata
-- Stores Cloudinary URLs and file information

CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NULL,
  cloudinary_url TEXT NOT NULL,
  cloudinary_public_id TEXT NULL,
  thumbnail_url TEXT NULL,
  width INTEGER NULL,
  height INTEGER NULL,
  duration INTEGER NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_attachments_message 
  ON public.attachments USING btree (message_id);

CREATE INDEX IF NOT EXISTS idx_attachments_conversation 
  ON public.attachments USING btree (conversation_id);

CREATE INDEX IF NOT EXISTS idx_attachments_user 
  ON public.attachments USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_attachments_type 
  ON public.attachments USING btree (file_type);

CREATE INDEX IF NOT EXISTS idx_attachments_created_at 
  ON public.attachments USING btree (created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Users can view attachments in conversations they're part of
CREATE POLICY "Users can view attachments in their conversations"
  ON public.attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = attachments.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

-- Users can insert attachments in conversations they're part of
CREATE POLICY "Users can insert attachments in their conversations"
  ON public.attachments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = attachments.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

-- Users can delete their own attachments
CREATE POLICY "Users can delete their own attachments"
  ON public.attachments
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.attachments IS 'Stores chat attachment metadata and Cloudinary URLs';
COMMENT ON COLUMN public.attachments.cloudinary_url IS 'Full Cloudinary URL for the attachment';
COMMENT ON COLUMN public.attachments.thumbnail_url IS 'Thumbnail URL for images/videos';
COMMENT ON COLUMN public.attachments.width IS 'Image/video width in pixels';
COMMENT ON COLUMN public.attachments.height IS 'Image/video height in pixels';
COMMENT ON COLUMN public.attachments.duration IS 'Video/audio duration in seconds';
