-- ============================================
-- NOTIFICATION SYSTEM - AUTOMATIC TRIGGERS
-- Phase 1: Database Triggers for Auto-Notifications
-- ============================================

-- ============================================
-- 1. MESSAGE NOTIFICATIONS
-- ============================================

CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  sender_name TEXT;
  conversation_exists BOOLEAN;
BEGIN
  -- Get recipient (other participant in conversation)
  SELECT user_id INTO recipient_id
  FROM conversation_participants
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id
  LIMIT 1;
  
  -- Get sender name
  SELECT name INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;
  
  -- Only create notification if recipient exists and message has content
  IF recipient_id IS NOT NULL AND (NEW.content IS NOT NULL OR NEW.media_url IS NOT NULL) THEN
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

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_new_message_notification ON messages;

-- Create trigger
CREATE TRIGGER trigger_new_message_notification
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();

-- ============================================
-- 2. FRIEND REQUEST NOTIFICATIONS
-- ============================================

CREATE OR REPLACE FUNCTION notify_friend_request()
RETURNS TRIGGER AS $$
DECLARE
  requester_name TEXT;
BEGIN
  -- Get requester name
  SELECT name INTO requester_name
  FROM profiles
  WHERE id = NEW.requester_id;
  
  -- Create notification for recipient
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link,
    related_id,
    related_user_id
  ) VALUES (
    NEW.recipient_id,
    'friend-request',
    'Friend request from ' || COALESCE(requester_name, 'Someone'),
    COALESCE(requester_name, 'Someone') || ' wants to connect with you',
    '/friends',
    NEW.id,
    NEW.requester_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_friend_request_notification ON friend_requests;

-- Create trigger
CREATE TRIGGER trigger_friend_request_notification
AFTER INSERT ON friend_requests
FOR EACH ROW
EXECUTE FUNCTION notify_friend_request();

-- ============================================
-- 3. FRIEND REQUEST ACCEPTED NOTIFICATION
-- ============================================

CREATE OR REPLACE FUNCTION notify_friend_request_accepted()
RETURNS TRIGGER AS $$
DECLARE
  accepter_name TEXT;
BEGIN
  -- Only notify if status changed from pending to accepted
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Get accepter name
    SELECT name INTO accepter_name
    FROM profiles
    WHERE id = NEW.recipient_id;
    
    -- Notify the original requester
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      link,
      related_id,
      related_user_id
    ) VALUES (
      NEW.requester_id,
      'friend-accepted',
      COALESCE(accepter_name, 'Someone') || ' accepted your friend request',
      'You are now friends with ' || COALESCE(accepter_name, 'Someone'),
      '/friends',
      NEW.id,
      NEW.recipient_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_friend_accepted_notification ON friend_requests;

-- Create trigger
CREATE TRIGGER trigger_friend_accepted_notification
AFTER UPDATE ON friend_requests
FOR EACH ROW
EXECUTE FUNCTION notify_friend_request_accepted();

-- ============================================
-- 4. POST LIKE NOTIFICATIONS
-- ============================================

CREATE OR REPLACE FUNCTION notify_post_reaction()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  reactor_name TEXT;
  post_content TEXT;
BEGIN
  -- Get post author and content
  SELECT user_id, LEFT(content, 50) INTO post_author_id, post_content
  FROM community_posts
  WHERE id = NEW.post_id;
  
  -- Don't notify if user liked their own post
  IF post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get reactor name
  SELECT name INTO reactor_name
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link,
    related_id,
    related_user_id
  ) VALUES (
    post_author_id,
    'post-like',
    COALESCE(reactor_name, 'Someone') || ' liked your post',
    post_content,
    '/community',
    NEW.post_id,
    NEW.user_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_post_reaction_notification ON post_reactions;

-- Create trigger
CREATE TRIGGER trigger_post_reaction_notification
AFTER INSERT ON post_reactions
FOR EACH ROW
EXECUTE FUNCTION notify_post_reaction();

-- ============================================
-- 5. COMMENT NOTIFICATIONS
-- ============================================

CREATE OR REPLACE FUNCTION notify_post_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  commenter_name TEXT;
  post_content TEXT;
BEGIN
  -- Get post author and content
  SELECT user_id, LEFT(content, 50) INTO post_author_id, post_content
  FROM community_posts
  WHERE id = NEW.post_id;
  
  -- Don't notify if user commented on their own post
  IF post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get commenter name
  SELECT name INTO commenter_name
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link,
    related_id,
    related_user_id
  ) VALUES (
    post_author_id,
    'post-comment',
    COALESCE(commenter_name, 'Someone') || ' commented on your post',
    LEFT(NEW.content, 100),
    '/community',
    NEW.post_id,
    NEW.user_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_post_comment_notification ON post_comments;

-- Create trigger
CREATE TRIGGER trigger_post_comment_notification
AFTER INSERT ON post_comments
FOR EACH ROW
EXECUTE FUNCTION notify_post_comment();

-- ============================================
-- 6. EVENT RSVP NOTIFICATIONS (BONUS)
-- ============================================

CREATE OR REPLACE FUNCTION notify_event_rsvp()
RETURNS TRIGGER AS $$
DECLARE
  event_creator_id UUID;
  rsvp_user_name TEXT;
  event_title TEXT;
BEGIN
  -- Get event creator and title
  SELECT created_by, title INTO event_creator_id, event_title
  FROM cultural_events
  WHERE id = NEW.event_id;
  
  -- Don't notify if creator RSVPs to their own event
  IF event_creator_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get RSVP user name
  SELECT name INTO rsvp_user_name
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Create notification only for "going" status
  IF NEW.status = 'going' THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      link,
      related_id,
      related_user_id
    ) VALUES (
      event_creator_id,
      'event-rsvp',
      COALESCE(rsvp_user_name, 'Someone') || ' is attending your event',
      'Event: ' || event_title,
      '/events',
      NEW.event_id,
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_event_rsvp_notification ON event_rsvps;

-- Create trigger
CREATE TRIGGER trigger_event_rsvp_notification
AFTER INSERT ON event_rsvps
FOR EACH ROW
EXECUTE FUNCTION notify_event_rsvp();

-- ============================================
-- COMMENTS AND DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION notify_new_message() IS 'Automatically create notification when a new message is sent';
COMMENT ON FUNCTION notify_friend_request() IS 'Automatically create notification when a friend request is sent';
COMMENT ON FUNCTION notify_friend_request_accepted() IS 'Automatically create notification when a friend request is accepted';
COMMENT ON FUNCTION notify_post_reaction() IS 'Automatically create notification when someone likes a post';
COMMENT ON FUNCTION notify_post_comment() IS 'Automatically create notification when someone comments on a post';
COMMENT ON FUNCTION notify_event_rsvp() IS 'Automatically create notification when someone RSVPs to an event';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Notification triggers created successfully!';
  RAISE NOTICE 'Triggers active for: messages, friend_requests, post_reactions, post_comments, event_rsvps';
END $$;
