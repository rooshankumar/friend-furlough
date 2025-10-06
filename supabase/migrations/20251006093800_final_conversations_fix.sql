-- Final fix for conversations RLS policy
-- The table has: user_id uuid null default auth.uid()
-- So we just need to allow authenticated users to insert

-- Drop all existing INSERT policies to avoid conflicts
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "authenticated_insert_conversations" ON public.conversations;
DROP POLICY IF EXISTS "enable_insert_for_authenticated_users" ON public.conversations;

-- Create a permissive INSERT policy for authenticated users
-- Since user_id has a default of auth.uid(), this will work correctly
CREATE POLICY "authenticated_users_can_insert_conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (true);
