-- Fix RLS Policies for Conversations - Security Critical
-- Issue: Current policies allow any authenticated user to view/modify any conversation
-- Fix: Restrict access to only conversation participants

-- ============================================
-- DROP EXISTING OVERLY PERMISSIVE POLICIES
-- ============================================

DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_delete_policy" ON public.conversations;

-- ============================================
-- CREATE SECURE POLICIES FOR CONVERSATIONS
-- ============================================

-- Users can only view conversations they're participating in
CREATE POLICY "conversations_select_policy"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Users can only update conversations they're participating in
CREATE POLICY "conversations_update_policy"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Users can only delete conversations they created or are participating in
CREATE POLICY "conversations_delete_policy"
ON public.conversations
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() OR
  id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- ADD MISSING INDEXES FOR PERFORMANCE
-- ============================================

-- Index for client_id lookups (used in message reconciliation)
CREATE INDEX IF NOT EXISTS idx_messages_client_id ON public.messages(client_id) 
WHERE client_id IS NOT NULL;

-- Composite index for faster participant lookups
CREATE INDEX IF NOT EXISTS idx_conversation_participants_composite 
ON public.conversation_participants(user_id, conversation_id);

-- Index for unread count queries
CREATE INDEX IF NOT EXISTS idx_conversation_participants_unread 
ON public.conversation_participants(user_id, unread_count) 
WHERE unread_count > 0;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON POLICY "conversations_select_policy" ON public.conversations IS 
'Users can only view conversations they are participating in';

COMMENT ON POLICY "conversations_update_policy" ON public.conversations IS 
'Users can only update conversations they are participating in';

COMMENT ON POLICY "conversations_delete_policy" ON public.conversations IS 
'Users can delete conversations they created or are participating in';
