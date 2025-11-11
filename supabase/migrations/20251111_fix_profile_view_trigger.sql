-- Fix profile view trigger - remove ::text cast on related_id
-- The notifications.related_id column is UUID, not text

CREATE OR REPLACE FUNCTION notify_profile_view()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if viewer is not the profile owner
  IF NEW.viewer_id != NEW.profile_id THEN
    -- Get viewer's name and create notification
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
      NEW.id,  -- FIXED: Removed ::text cast
      NEW.viewer_id,
      false
    FROM profiles p
    WHERE p.id = NEW.viewer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON FUNCTION notify_profile_view() IS 'Creates notification when someone views a profile (fixed UUID cast)';
