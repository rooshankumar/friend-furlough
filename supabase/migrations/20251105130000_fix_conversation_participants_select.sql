-- Fix conversation_participants SELECT policy to allow viewing all participants in your conversations

-- Drop the restrictive policy
DROP POLICY IF EXISTS "participants_select_own" ON public.conversation_participants;

-- Create a policy that allows viewing all participants in conversations you're part of
CREATE POLICY "participants_select_in_own_conversations"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Add a comment explaining the policy
COMMENT ON POLICY "participants_select_in_own_conversations" ON public.conversation_participants IS 
'Allows users to view all participants in conversations they are part of. This is needed to display other users names and avatars in the chat list.';
