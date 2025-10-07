-- Fix community post deletion RLS policies
-- Run this in Supabase SQL Editor

-- Check if RLS is enabled
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Users can delete own posts" ON community_posts;
DROP POLICY IF EXISTS "delete_own_posts" ON community_posts;

-- Create proper DELETE policy
CREATE POLICY "Users can delete their own posts"
ON community_posts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Also ensure users can see their own posts
DROP POLICY IF EXISTS "Users can view all posts" ON community_posts;
CREATE POLICY "Users can view all posts"
ON community_posts
FOR SELECT
TO authenticated
USING (true);

-- Ensure users can insert their own posts
DROP POLICY IF EXISTS "Users can create posts" ON community_posts;
CREATE POLICY "Users can create posts"
ON community_posts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
