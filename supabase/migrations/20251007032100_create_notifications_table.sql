-- Create Notifications table
-- Issue #13: Notifications System

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'message', 'friend-request', 'post-like', 'post-comment', 'event-invite', etc.
  title TEXT NOT NULL,
  message TEXT,
  link TEXT, -- URL to navigate when clicked
  related_id UUID, -- ID of related entity (message, post, event, etc.)
  related_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- System can create notifications (will be done via backend triggers/functions)
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT DEFAULT NULL,
  p_link TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL,
  p_related_user_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link, related_id, related_user_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_related_id, p_related_user_id)
  RETURNING id INTO new_notification_id;
  
  RETURN new_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS VOID AS $$
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE user_id = auth.uid() AND read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE public.notifications IS 'User notifications for various events';
COMMENT ON FUNCTION create_notification IS 'Helper function to create a notification';
COMMENT ON FUNCTION mark_notification_read IS 'Mark a specific notification as read';
COMMENT ON FUNCTION mark_all_notifications_read IS 'Mark all user notifications as read';
