-- ============================================
-- ATTACHMENTS TABLE - RLS POLICIES
-- ============================================
-- Add RLS policies for the attachments table

-- Enable RLS if not already enabled
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view attachments in their conversations" ON public.attachments;
DROP POLICY IF EXISTS "Users can insert attachments in their conversations" ON public.attachments;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON public.attachments;

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

-- Add comments
COMMENT ON TABLE public.attachments IS 'Stores chat attachment metadata and Cloudinary URLs';
COMMENT ON COLUMN public.attachments.cloudinary_url IS 'Full Cloudinary URL for the attachment';
COMMENT ON COLUMN public.attachments.thumbnail_url IS 'Thumbnail URL for images/videos';
COMMENT ON COLUMN public.attachments.width IS 'Image/video width in pixels';
COMMENT ON COLUMN public.attachments.height IS 'Image/video height in pixels';
COMMENT ON COLUMN public.attachments.duration IS 'Video/audio duration in seconds';
