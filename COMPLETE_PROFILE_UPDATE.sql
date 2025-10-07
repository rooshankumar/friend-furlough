-- Complete Profile and Friend Request System Setup
-- Run this in Supabase SQL Editor

-- 1. Add missing fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say')),
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS language_goals text[],
ADD COLUMN IF NOT EXISTS looking_for text[],
ADD COLUMN IF NOT EXISTS teaching_experience boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS countries_visited text[];

-- Add comments for documentation
COMMENT ON COLUMN profiles.gender IS 'User''s gender identity';
COMMENT ON COLUMN profiles.city IS 'User''s city';
COMMENT ON COLUMN profiles.language_goals IS 'User''s language learning goals';
COMMENT ON COLUMN profiles.looking_for IS 'What the user is looking for (friends, exchange, etc.)';
COMMENT ON COLUMN profiles.teaching_experience IS 'Whether user has teaching experience';
COMMENT ON COLUMN profiles.countries_visited IS 'Countries the user has visited';

-- 2. Create friend_requests table
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- 3. Create friendships table (for accepted friend requests)
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id) -- Ensure consistent ordering
);

-- 4. Enable RLS
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for friend_requests
DROP POLICY IF EXISTS "Users can view their own friend requests" ON friend_requests;
CREATE POLICY "Users can view their own friend requests"
ON friend_requests FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send friend requests" ON friend_requests;
CREATE POLICY "Users can send friend requests"
ON friend_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update received friend requests" ON friend_requests;
CREATE POLICY "Users can update received friend requests"
ON friend_requests FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id);

-- 6. RLS Policies for friendships
DROP POLICY IF EXISTS "Users can view their friendships" ON friendships;
CREATE POLICY "Users can view their friendships"
ON friendships FOR SELECT
TO authenticated
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "System can create friendships" ON friendships;
CREATE POLICY "System can create friendships"
ON friendships FOR INSERT
TO authenticated
WITH CHECK (true);

-- 7. Function to create friendship when request is accepted
CREATE OR REPLACE FUNCTION handle_friend_request_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If request was accepted, create friendship
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO friendships (user1_id, user2_id)
    VALUES (
      LEAST(NEW.sender_id, NEW.receiver_id),
      GREATEST(NEW.sender_id, NEW.receiver_id)
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger to auto-create friendship
DROP TRIGGER IF EXISTS friend_request_accepted ON friend_requests;
CREATE TRIGGER friend_request_accepted
  AFTER UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_friend_request_update();

-- 9. Function to check if users are friends
CREATE OR REPLACE FUNCTION are_friends(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM friendships
    WHERE (user1_id = LEAST($1, $2) AND user2_id = GREATEST($1, $2))
  );
END;
$$ LANGUAGE plpgsql;

-- 10. Function to get friend request status
CREATE OR REPLACE FUNCTION get_friend_request_status(sender_id UUID, receiver_id UUID)
RETURNS TEXT AS $$
DECLARE
  request_status TEXT;
BEGIN
  SELECT status INTO request_status
  FROM friend_requests
  WHERE (friend_requests.sender_id = $1 AND friend_requests.receiver_id = $2)
     OR (friend_requests.sender_id = $2 AND friend_requests.receiver_id = $1);
  
  RETURN COALESCE(request_status, 'none');
END;
$$ LANGUAGE plpgsql;

-- 11. Update existing profiles with default values (optional)
UPDATE profiles 
SET 
  language_goals = COALESCE(language_goals, '{}'),
  looking_for = COALESCE(looking_for, '{}'),
  countries_visited = COALESCE(countries_visited, '{}'),
  teaching_experience = COALESCE(teaching_experience, false)
WHERE language_goals IS NULL 
   OR looking_for IS NULL 
   OR countries_visited IS NULL 
   OR teaching_experience IS NULL;
