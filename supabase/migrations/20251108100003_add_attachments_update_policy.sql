-- ============================================
-- ATTACHMENTS TABLE - ADD UPDATE POLICY
-- ============================================
-- Allow users to update their own attachments (for linking message_id)

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can update their own attachments" ON public.attachments;

-- Users can update their own attachments
CREATE POLICY "Users can update their own attachments"
  ON public.attachments
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
