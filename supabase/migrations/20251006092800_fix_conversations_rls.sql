-- Fix conversations RLS policy to allow authenticated users to create conversations
-- Drop all existing insert policies to avoid conflicts
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;

-- Create a simple insert policy that allows authenticated users to create conversations
-- The user must set user_id to their own auth.uid()
CREATE POLICY "Authenticated users can create conversations"
ON conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
