-- Make non-core profile fields nullable
-- Core fields: id, name, country, age, gender, onboarding_completed
-- Optional fields: bio, city, avatar_url, looking_for, language_goals, countries_visited, teaching_experience

-- Bio is already nullable
-- City is already nullable
-- Avatar_url is already nullable
-- Looking_for is already nullable
-- Language_goals is already nullable
-- Countries_visited is already nullable
-- Teaching_experience is already nullable

-- Ensure country, age, and gender can be null during signup (before onboarding)
-- But we'll enforce them during onboarding completion

-- Add comment to clarify required vs optional fields
COMMENT ON COLUMN public.profiles.name IS 'Required: User full name';
COMMENT ON COLUMN public.profiles.country IS 'Required for onboarding: User country name';
COMMENT ON COLUMN public.profiles.country_code IS 'Required for onboarding: ISO country code';
COMMENT ON COLUMN public.profiles.age IS 'Required for onboarding: User age (16+)';
COMMENT ON COLUMN public.profiles.gender IS 'Required for onboarding: User gender';
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Required: Indicates if user completed onboarding';

COMMENT ON COLUMN public.profiles.bio IS 'Optional: User bio/description';
COMMENT ON COLUMN public.profiles.city IS 'Optional: User city';
COMMENT ON COLUMN public.profiles.avatar_url IS 'Optional: Profile picture URL';
COMMENT ON COLUMN public.profiles.looking_for IS 'Optional: What user is looking for (language exchange, friends, etc)';
COMMENT ON COLUMN public.profiles.language_goals IS 'Optional: Languages user wants to learn';
COMMENT ON COLUMN public.profiles.countries_visited IS 'Optional: Countries user has visited';
COMMENT ON COLUMN public.profiles.teaching_experience IS 'Optional: Whether user has teaching experience';

-- Create a function to validate onboarding completion
CREATE OR REPLACE FUNCTION public.validate_onboarding_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- If onboarding_completed is being set to true, validate required fields
  IF NEW.onboarding_completed = true THEN
    IF NEW.name IS NULL OR NEW.name = '' THEN
      RAISE EXCEPTION 'Name is required to complete onboarding';
    END IF;
    
    IF NEW.country IS NULL OR NEW.country = '' THEN
      RAISE EXCEPTION 'Country is required to complete onboarding';
    END IF;
    
    IF NEW.age IS NULL OR NEW.age < 16 THEN
      RAISE EXCEPTION 'Age (16+) is required to complete onboarding';
    END IF;
    
    IF NEW.gender IS NULL OR NEW.gender = '' THEN
      RAISE EXCEPTION 'Gender is required to complete onboarding';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate onboarding completion
DROP TRIGGER IF EXISTS validate_onboarding_trigger ON public.profiles;
CREATE TRIGGER validate_onboarding_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_onboarding_completion();
