-- ==========================================
-- IMPROVED MESSAGE NOTIFICATION SYSTEM
-- ==========================================
-- Features:
-- 1. Group messages within 30 minutes (no spam)
-- 2. Respect user notification settings
-- 3. Create new notification after 30min timeout
-- 4. Show message count for grouped notifications

-- ==========================================
-- Step 1: Add notification settings to profiles
-- ==========================================

-- Add notification preferences column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "messages": true,
  "friend_requests": true,
  "post_reactions": true,
  "profile_views": true,
  "events": true
}'::jsonb;

-- Add index for faster lookup
CREATE INDEX IF NOT EXISTS idx_profiles_notification_settings 
  ON profiles USING gin(notification_settings);

-- ==========================================
-- Step 2: Improved Message Notification Function
-- ==========================================

CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  sender_name TEXT;
  recent_notification_id UUID;
  recent_notification_time TIMESTAMP WITH TIME ZONE;
  notification_enabled BOOLEAN;
  message_count INTEGER;
BEGIN
  -- Get recipient (other participant in conversation)
  SELECT user_id INTO recipient_id
  FROM conversation_participants
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id
  LIMIT 1;
  
  -- Exit if no recipient
  IF recipient_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if user has message notifications enabled
  SELECT COALESCE(
    (notification_settings->>'messages')::boolean,
    true  -- Default to true if not set
  ) INTO notification_enabled
  FROM profiles
  WHERE id = recipient_id;
  
  -- Exit if notifications are disabled
  IF NOT notification_enabled THEN
    RETURN NEW;
  END IF;
  
  -- Get sender name
  SELECT name INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;
  
  -- Check for recent notification from same sender (within 30 minutes)
  SELECT id, created_at INTO recent_notification_id, recent_notification_time
  FROM notifications
  WHERE user_id = recipient_id
    AND type = 'message'
    AND related_user_id = NEW.sender_id
    AND read = false  -- Only group unread notifications
    AND created_at > NOW() - INTERVAL '30 minutes'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If recent notification exists (within 30 min), update it
  IF recent_notification_id IS NOT NULL THEN
    -- Get current message count from notification message
    SELECT COALESCE(
      NULLIF(regexp_replace(message, '[^0-9]', '', 'g'), '')::integer,
      1
    ) INTO message_count
    FROM notifications
    WHERE id = recent_notification_id;
    
    -- Increment count
    message_count := message_count + 1;
    
    -- Update existing notification with new count and time
    UPDATE notifications
    SET 
      title = 'New messages from ' || COALESCE(sender_name, 'Someone'),
      message = message_count || ' new messages',
      created_at = NOW(),  -- Update timestamp to keep it recent
      link = '/chat/' || NEW.conversation_id,
      related_id = NEW.id  -- Update to latest message
    WHERE id = recent_notification_id;
    
  ELSE
    -- Create new notification (no recent notification or 30min expired)
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      link,
      related_id,
      related_user_id
    ) VALUES (
      recipient_id,
      'message',
      'New message from ' || COALESCE(sender_name, 'Someone'),
      CASE 
        WHEN NEW.type = 'image' THEN '📷 Photo'
        WHEN NEW.type = 'voice' THEN '🎤 Voice message'
        WHEN NEW.type = 'file' THEN '📎 File'
        ELSE LEFT(NEW.content, 100)
      END,
      '/chat/' || NEW.conversation_id,
      NEW.id,
      NEW.sender_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- Step 3: Update Trigger
-- ==========================================

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_new_message_notification ON messages;

CREATE TRIGGER trigger_new_message_notification
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();

-- ==========================================
-- Step 4: Add Helper Function to Toggle Notifications
-- ==========================================

CREATE OR REPLACE FUNCTION toggle_notification_setting(
  setting_key TEXT,
  enabled BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET notification_settings = jsonb_set(
    COALESCE(notification_settings, '{}'::jsonb),
    ARRAY[setting_key],
    to_jsonb(enabled)
  )
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- Step 5: Add Helper Function to Get Notification Settings
-- ==========================================

CREATE OR REPLACE FUNCTION get_notification_settings()
RETURNS JSONB AS $$
DECLARE
  settings JSONB;
BEGIN
  SELECT COALESCE(
    notification_settings,
    '{
      "messages": true,
      "friend_requests": true,
      "post_reactions": true,
      "profile_views": true,
      "events": true
    }'::jsonb
  ) INTO settings
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- USAGE EXAMPLES
-- ==========================================

-- Toggle message notifications off:
-- SELECT toggle_notification_setting('messages', false);

-- Toggle message notifications on:
-- SELECT toggle_notification_setting('messages', true);

-- Get current settings:
-- SELECT get_notification_settings();

-- ==========================================
-- SUMMARY
-- ==========================================
-- ✅ Messages within 30 minutes are grouped (no spam)
-- ✅ New notification created after 30min timeout
-- ✅ Respects user notification settings
-- ✅ Shows message count for grouped notifications
-- ✅ Updates timestamp to keep notification recent
-- ✅ Only groups unread notifications

-- Example behavior:
-- 10:00 - User A sends message → Notification: "New message from User A"
-- 10:05 - User A sends 5 more messages → Notification updated: "6 new messages"
-- 10:35 - User A sends message → NEW notification: "New message from User A"
-- (30 minutes passed, so new notification is created)

COMMENT ON FUNCTION notify_new_message() IS 'Creates or updates message notifications with 30-minute grouping and respects user settings';
COMMENT ON FUNCTION toggle_notification_setting(TEXT, BOOLEAN) IS 'Toggle notification settings for current user';
COMMENT ON FUNCTION get_notification_settings() IS 'Get notification settings for current user';
