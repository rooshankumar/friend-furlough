-- Comprehensive fix for conversations and conversation_participants RLS policies

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================

-- Re-enable RLS if disabled
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "authenticated_insert_conversations" ON public.conversations;
DROP POLICY IF EXISTS "authenticated_users_can_insert_conversations" ON public.conversations;
DROP POLICY IF EXISTS "allow_authenticated_insert" ON public.conversations;
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their conversations" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_delete_policy" ON public.conversations;

-- Create new policies for conversations
CREATE POLICY "conversations_insert_policy"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "conversations_select_policy"
ON public.conversations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "conversations_update_policy"
ON public.conversations
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "conversations_delete_policy"
ON public.conversations
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- CONVERSATION_PARTICIPANTS TABLE
-- ============================================

-- Re-enable RLS if disabled
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "allow_authenticated_insert_participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update own participant record" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_insert_policy" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_select_policy" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_update_policy" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_delete_policy" ON public.conversation_participants;

-- Create new policies for conversation_participants
-- Simplified to avoid infinite recursion
CREATE POLICY "participants_insert_policy"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "participants_select_policy"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "participants_update_policy"
ON public.conversation_participants
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "participants_delete_policy"
ON public.conversation_participants
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
