-- Add missing profile fields for better user matching and discovery
-- Issue #9: Missing Profile Fields

-- Add city field
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS city TEXT;

-- Add looking_for as a text array (what users are seeking)
-- Examples: 'language-exchange', 'cultural-friends', 'travel-tips', etc.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS looking_for TEXT[];

-- Add language_goals as a text array
-- Examples: 'fluency', 'conversation', 'business', 'travel', etc.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS language_goals TEXT[];

-- Add countries_visited as a text array (country codes)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS countries_visited TEXT[];

-- Add teaching_experience boolean
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS teaching_experience BOOLEAN DEFAULT false;

-- Add index for city lookups
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);

-- Add index for looking_for array searches
CREATE INDEX IF NOT EXISTS idx_profiles_looking_for ON public.profiles USING GIN(looking_for);

-- Comment on columns for documentation
COMMENT ON COLUMN public.profiles.city IS 'User''s current city of residence';
COMMENT ON COLUMN public.profiles.looking_for IS 'What the user is looking for: language-exchange, cultural-friends, travel-tips, professional-network, cooking-exchange, art-collaboration';
COMMENT ON COLUMN public.profiles.language_goals IS 'User''s language learning goals: fluency, conversation, business, travel, academic';
COMMENT ON COLUMN public.profiles.countries_visited IS 'Array of country codes for countries the user has visited';
COMMENT ON COLUMN public.profiles.teaching_experience IS 'Whether user has experience teaching languages';
