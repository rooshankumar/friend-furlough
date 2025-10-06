-- Fix conversations RLS policies to allow creation
-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "allow_insert_authenticated" ON public.conversations;

-- Create a simple insert policy that allows authenticated users to create conversations
CREATE POLICY "Authenticated users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Ensure the select policies work correctly
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "allow_select_participant" ON public.conversations;

CREATE POLICY "Users can view conversations they participate in"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversations.id
    AND cp.user_id = auth.uid()
  )
);