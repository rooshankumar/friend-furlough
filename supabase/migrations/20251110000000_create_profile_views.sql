-- Create profile_views table to track who viewed whose profile
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON profile_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_id ON profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_viewer ON profile_views(profile_id, viewer_id);

-- Note: We handle duplicate prevention in application code instead of database constraint
-- This avoids timezone-dependent functions in indexes which must be IMMUTABLE

-- Enable Row Level Security
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view who visited their profile
CREATE POLICY "Users can view their profile visitors"
ON profile_views
FOR SELECT
USING (auth.uid() = profile_id);

-- Users can view profiles they visited
CREATE POLICY "Users can view their own profile views"
ON profile_views
FOR SELECT
USING (auth.uid() = viewer_id);

-- Users can insert profile views (track when they view someone's profile)
CREATE POLICY "Users can insert profile views"
ON profile_views
FOR INSERT
WITH CHECK (auth.uid() = viewer_id);

-- Users can delete their own profile view records
CREATE POLICY "Users can delete their own profile views"
ON profile_views
FOR DELETE
USING (auth.uid() = viewer_id);

-- Function to create notification when someone views a profile
CREATE OR REPLACE FUNCTION notify_profile_view()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if viewer is not the profile owner
  IF NEW.viewer_id != NEW.profile_id THEN
    -- Get viewer's name
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      link,
      related_id,
      related_user_id,
      read
    )
    SELECT
      NEW.profile_id,
      'profile-view',
      'Someone viewed your profile',
      p.name || ' viewed your profile',
      '/profile/' || NEW.viewer_id,
      NEW.id::text,
      NEW.viewer_id,
      false
    FROM profiles p
    WHERE p.id = NEW.viewer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to notify on profile view
DROP TRIGGER IF EXISTS trigger_notify_profile_view ON profile_views;
CREATE TRIGGER trigger_notify_profile_view
  AFTER INSERT ON profile_views
  FOR EACH ROW
  EXECUTE FUNCTION notify_profile_view();

-- Add comment
COMMENT ON TABLE profile_views IS 'Tracks profile views for the "who viewed my profile" feature';
