-- Community Post Reactions and Comments System Setup (Safe Version)
-- Run this in Supabase SQL Editor

-- Create post_reactions table
CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT CHECK (reaction_type IN ('like', 'love', 'laugh', 'angry', 'sad')) DEFAULT 'like',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- Create post_comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (safe to run multiple times)
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DO $$ 
BEGIN
    -- Drop and recreate post_reactions policies
    DROP POLICY IF EXISTS "Anyone can view post reactions" ON post_reactions;
    DROP POLICY IF EXISTS "Users can add reactions" ON post_reactions;
    DROP POLICY IF EXISTS "Users can remove their own reactions" ON post_reactions;
    
    -- Drop and recreate post_comments policies
    DROP POLICY IF EXISTS "Anyone can view post comments" ON post_comments;
    DROP POLICY IF EXISTS "Users can add comments" ON post_comments;
    DROP POLICY IF EXISTS "Users can update their own comments" ON post_comments;
    DROP POLICY IF EXISTS "Users can delete their own comments" ON post_comments;
END $$;

-- Create RLS Policies for post_reactions
CREATE POLICY "Anyone can view post reactions"
ON post_reactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can add reactions"
ON post_reactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
ON post_reactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create RLS Policies for post_comments
CREATE POLICY "Anyone can view post comments"
ON post_comments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can add comments"
ON post_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON post_comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON post_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create or replace functions (safe to run multiple times)
CREATE OR REPLACE FUNCTION get_post_reaction_count(post_uuid UUID, reaction_type_param TEXT DEFAULT 'like')
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM post_reactions
    WHERE post_id = post_uuid 
    AND reaction_type = reaction_type_param
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_post_comment_count(post_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM post_comments
    WHERE post_id = post_uuid
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION has_user_reacted_to_post(post_uuid UUID, user_uuid UUID, reaction_type_param TEXT DEFAULT 'like')
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM post_reactions
    WHERE post_id = post_uuid 
    AND user_id = user_uuid
    AND reaction_type = reaction_type_param
  );
END;
$$ LANGUAGE plpgsql;

-- Add indexes (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_comment_id);
