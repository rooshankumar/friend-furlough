-- Profile Reactions System Setup
-- Run this in Supabase SQL Editor

-- Create profile_reactions table
CREATE TABLE IF NOT EXISTS profile_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reactor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT CHECK (reaction_type IN ('heart', 'like', 'appreciate')) DEFAULT 'heart',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, reactor_id, reaction_type)
);

-- Enable RLS
ALTER TABLE profile_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profile_reactions
CREATE POLICY "Users can view all profile reactions"
ON profile_reactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can add reactions"
ON profile_reactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reactor_id);

CREATE POLICY "Users can remove their own reactions"
ON profile_reactions FOR DELETE
TO authenticated
USING (auth.uid() = reactor_id);

-- Function to get reaction count for a profile
CREATE OR REPLACE FUNCTION get_profile_reaction_count(profile_user_id UUID, reaction_type_param TEXT DEFAULT 'heart')
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM profile_reactions
    WHERE profile_id = profile_user_id 
    AND reaction_type = reaction_type_param
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has reacted to a profile
CREATE OR REPLACE FUNCTION has_user_reacted_to_profile(profile_user_id UUID, reactor_user_id UUID, reaction_type_param TEXT DEFAULT 'heart')
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profile_reactions
    WHERE profile_id = profile_user_id 
    AND reactor_id = reactor_user_id
    AND reaction_type = reaction_type_param
  );
END;
$$ LANGUAGE plpgsql;
