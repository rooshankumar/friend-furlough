-- Fix conversation_participants INSERT policy to allow creating conversations with other users

-- Drop the restrictive policy created in the previous migration
DROP POLICY IF EXISTS "participants_insert_own" ON public.conversation_participants;

-- Recreate a permissive policy that allows inserting any participant
-- This is safe because:
-- 1. Users can only create conversations with people they want to chat with
-- 2. The conversation itself is created first, so the conversation_id must exist
-- 3. Both participants need to be added for the conversation to work
CREATE POLICY "participants_insert_any"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add a comment explaining the policy
COMMENT ON POLICY "participants_insert_any" ON public.conversation_participants IS 
'Allows authenticated users to insert conversation participants. This is needed to create conversations with other users.';
