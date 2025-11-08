-- ============================================
-- SIMPLIFY MESSAGES TABLE
-- ============================================
-- Remove media_url column since we now use attachments table
-- This makes the architecture cleaner and avoids data duplication

-- Drop the media_url column from messages table
ALTER TABLE public.messages DROP COLUMN IF EXISTS media_url;

-- Add comment to clarify the new architecture
COMMENT ON TABLE public.messages IS 'Chat messages - use attachments table for media files';
COMMENT ON COLUMN public.messages.type IS 'Message type: text, image, file, voice - media stored in attachments table';
