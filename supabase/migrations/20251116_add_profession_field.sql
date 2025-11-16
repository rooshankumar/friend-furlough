-- Add profession field to profiles table
-- This field stores the user's profession with first letter capitalization

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profession TEXT;

-- Add index for profession lookups
CREATE INDEX IF NOT EXISTS idx_profiles_profession 
  ON public.profiles(profession);

-- Comment on the column for documentation
COMMENT ON COLUMN public.profiles.profession IS 'User''s profession (stored with first letter capitalized)';
