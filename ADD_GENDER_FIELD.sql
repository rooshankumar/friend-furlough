-- Add gender field to profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS gender text
CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say'));

COMMENT ON COLUMN profiles.gender IS 'User''s gender identity';
