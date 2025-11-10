# Notification System - Current Implementation & Upgrade Plan

## 📊 CURRENT IMPLEMENTATION

### 1. **Database Structure**
```sql
Table: notifications
- id (UUID)
- user_id (UUID) - recipient
- type (TEXT) - 'message', 'friend-request', 'post-like', etc.
- title (TEXT)
- message (TEXT)
- link (TEXT) - navigation URL
- related_id (UUID) - related entity ID
- related_user_id (UUID) - who triggered the notification
- read (BOOLEAN)
- created_at (TIMESTAMP)
```

### 2. **Frontend Store** (`notificationStore.ts`)
- ✅ Load notifications (last 50)
- ✅ Mark as read (single)
- ✅ Mark all as read
- ✅ Delete notification
- ✅ Real-time subscription (INSERT/UPDATE)
- ✅ Unread count tracking

### 3. **Push Notifications** (`push.ts`)
- ✅ Service Worker registration
- ✅ Push subscription with VAPID keys
- ✅ Save subscription to database
- ❌ No backend to send push notifications

### 4. **UI Components**
- Navigation badge showing unread count
- Basic notification list
- No notification center/dropdown
- No grouping or categorization

---

## 🚨 CURRENT PROBLEMS

### Critical Issues:
1. **No Automatic Triggers** - Notifications must be created manually
2. **No Push Backend** - Push subscriptions saved but never used
3. **No Notification for:**
   - New messages
   - Friend requests
   - Post likes/comments
   - Event invites
   - System announcements
4. **Poor UX:**
   - No notification center dropdown
   - No notification sounds
   - No grouping (e.g., "John and 5 others liked your post")
   - No action buttons (Accept/Decline friend request)
   - No notification preferences
5. **No Cleanup** - Old notifications never deleted
6. **No Analytics** - Can't track notification engagement

---

## 🎯 PROPOSED UPGRADE PLAN

### Phase 1: Database Triggers (PRIORITY 1)

#### A. Message Notifications
```sql
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  sender_name TEXT;
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
  
  -- Create notification
  IF recipient_id IS NOT NULL THEN
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
      'New message from ' || sender_name,
      LEFT(NEW.content, 100),
      '/chat/' || NEW.conversation_id,
      NEW.id,
      NEW.sender_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_new_message_notification
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();
```

#### B. Friend Request Notifications
```sql
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
    'Friend request from ' || requester_name,
    requester_name || ' wants to connect with you',
    '/friends',
    NEW.id,
    NEW.requester_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_friend_request_notification
AFTER INSERT ON friend_requests
FOR EACH ROW
EXECUTE FUNCTION notify_friend_request();
```

#### C. Friend Request Accepted Notification
```sql
CREATE OR REPLACE FUNCTION notify_friend_request_accepted()
RETURNS TRIGGER AS $$
DECLARE
  accepter_name TEXT;
BEGIN
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
      accepter_name || ' accepted your friend request',
      'You are now friends with ' || accepter_name,
      '/friends',
      NEW.id,
      NEW.recipient_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_friend_accepted_notification
AFTER UPDATE ON friend_requests
FOR EACH ROW
EXECUTE FUNCTION notify_friend_request_accepted();
```

#### D. Post Like Notifications
```sql
CREATE OR REPLACE FUNCTION notify_post_reaction()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  reactor_name TEXT;
  post_content TEXT;
BEGIN
  -- Get post author
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
    reactor_name || ' liked your post',
    post_content,
    '/community',
    NEW.post_id,
    NEW.user_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_post_reaction_notification
AFTER INSERT ON post_reactions
FOR EACH ROW
EXECUTE FUNCTION notify_post_reaction();
```

#### E. Comment Notifications
```sql
CREATE OR REPLACE FUNCTION notify_post_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  commenter_name TEXT;
  post_content TEXT;
BEGIN
  -- Get post author
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
    commenter_name || ' commented on your post',
    LEFT(NEW.content, 100),
    '/community',
    NEW.post_id,
    NEW.user_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_post_comment_notification
AFTER INSERT ON post_comments
FOR EACH ROW
EXECUTE FUNCTION notify_post_comment();
```

---

### Phase 2: Smart Notification Grouping

#### Add grouping fields to notifications table:
```sql
ALTER TABLE notifications ADD COLUMN group_key TEXT;
ALTER TABLE notifications ADD COLUMN group_count INTEGER DEFAULT 1;
CREATE INDEX idx_notifications_group ON notifications(user_id, group_key, read);
```

#### Grouping Logic:
- Multiple likes on same post → "John and 5 others liked your post"
- Multiple comments → "3 new comments on your post"
- Multiple messages from same person → "5 new messages from John"

---

### Phase 3: Enhanced UI Components

#### A. Notification Center Dropdown
```tsx
<NotificationCenter>
  - Header with "Mark all as read"
  - Categorized tabs (All, Messages, Social, System)
  - Grouped notifications
  - Action buttons (Accept/Decline, Reply, View)
  - Infinite scroll
  - Empty state
  - Loading skeleton
</NotificationCenter>
```

#### B. Notification Item Component
```tsx
<NotificationItem>
  - Avatar (user or icon)
  - Title + message
  - Timestamp (relative: "5 min ago")
  - Read/unread indicator
  - Action buttons
  - Swipe to delete (mobile)
  - Click to navigate + mark as read
</NotificationItem>
```

#### C. Notification Sounds
```tsx
// Play sound on new notification
const notificationSound = new Audio('/sounds/notification.mp3');
notificationSound.play();
```

---

### Phase 4: Push Notification Backend

#### A. Edge Function for Sending Push
```typescript
// supabase/functions/send-push/index.ts
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

Deno.serve(async (req) => {
  const { userId, title, body, link } = await req.json();
  
  // Get user's push subscriptions
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);
  
  // Send push to all devices
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        },
        JSON.stringify({ title, body, link })
      );
    } catch (error) {
      // Remove invalid subscription
      if (error.statusCode === 410) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', sub.endpoint);
      }
    }
  }
  
  return new Response('OK');
});
```

#### B. Trigger Push from Database
```sql
CREATE OR REPLACE FUNCTION send_push_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Call edge function to send push
  PERFORM net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'userId', NEW.user_id,
      'title', NEW.title,
      'body', NEW.message,
      'link', NEW.link
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_send_push
AFTER INSERT ON notifications
FOR EACH ROW
EXECUTE FUNCTION send_push_notification();
```

---

### Phase 5: Notification Preferences

#### A. Add preferences table:
```sql
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  message_notifications BOOLEAN DEFAULT true,
  friend_notifications BOOLEAN DEFAULT true,
  post_notifications BOOLEAN DEFAULT true,
  event_notifications BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### B. Settings UI
```tsx
<NotificationSettings>
  - Toggle for each notification type
  - Push notification toggle
  - Email notification toggle
  - Quiet hours (Do Not Disturb)
  - Notification sound selection
</NotificationSettings>
```

---

### Phase 6: Notification Cleanup & Analytics

#### A. Auto-delete old notifications
```sql
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND read = true;
END;
$$ LANGUAGE plpgsql;

-- Run daily
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 2 * * *', -- 2 AM daily
  'SELECT cleanup_old_notifications();'
);
```

#### B. Analytics tracking
```sql
ALTER TABLE notifications ADD COLUMN clicked BOOLEAN DEFAULT false;
ALTER TABLE notifications ADD COLUMN clicked_at TIMESTAMPTZ;

-- Track click-through rate
CREATE VIEW notification_analytics AS
SELECT
  type,
  COUNT(*) as total,
  SUM(CASE WHEN clicked THEN 1 ELSE 0 END) as clicked,
  ROUND(100.0 * SUM(CASE WHEN clicked THEN 1 ELSE 0 END) / COUNT(*), 2) as ctr
FROM notifications
GROUP BY type;
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Database Triggers (Week 1)
- [ ] Create message notification trigger
- [ ] Create friend request triggers
- [ ] Create post like trigger
- [ ] Create comment trigger
- [ ] Test all triggers
- [ ] Deploy migration

### Phase 2: Grouping (Week 2)
- [ ] Add grouping fields
- [ ] Implement grouping logic
- [ ] Update store to handle groups
- [ ] Test grouping

### Phase 3: UI Components (Week 2-3)
- [ ] Create NotificationCenter component
- [ ] Create NotificationItem component
- [ ] Add notification sounds
- [ ] Add action buttons
- [ ] Mobile optimizations
- [ ] Empty states

### Phase 4: Push Backend (Week 3)
- [ ] Create edge function
- [ ] Set up VAPID keys
- [ ] Test push notifications
- [ ] Handle subscription cleanup
- [ ] Deploy edge function

### Phase 5: Preferences (Week 4)
- [ ] Create preferences table
- [ ] Create settings UI
- [ ] Implement quiet hours
- [ ] Test preferences

### Phase 6: Cleanup & Analytics (Week 4)
- [ ] Set up cron job
- [ ] Add analytics tracking
- [ ] Create analytics dashboard
- [ ] Monitor performance

---

## 🎨 UI/UX IMPROVEMENTS

### Notification Center Design:
```
┌─────────────────────────────────┐
│ Notifications            Mark all│
├─────────────────────────────────┤
│ All | Messages | Social | System│
├─────────────────────────────────┤
│ ● John sent you a message       │
│   "Hey, how are you?"      5m   │
│   [Reply] [View]                │
├─────────────────────────────────┤
│ ● Sarah and 3 others liked your │
│   post                     10m  │
│   [View Post]                   │
├─────────────────────────────────┤
│   Mike accepted your friend     │
│   request                  1h   │
├─────────────────────────────────┤
│ Load more...                    │
└─────────────────────────────────┘
```

### Notification Types & Icons:
- 💬 Message - Blue
- 👥 Friend Request - Green
- ❤️ Post Like - Red
- 💭 Comment - Purple
- 📅 Event - Orange
- ⚙️ System - Gray

---

## 🚀 BENEFITS AFTER UPGRADE

1. **Real-time Engagement** - Users instantly notified of activity
2. **Better Retention** - Push notifications bring users back
3. **Reduced Noise** - Grouping prevents notification spam
4. **User Control** - Preferences let users customize experience
5. **Analytics** - Track what notifications work best
6. **Clean Database** - Auto-cleanup prevents bloat
7. **Professional UX** - Matches Instagram/WhatsApp quality

---

## 📊 EXPECTED METRICS

- **Notification Delivery Rate**: 95%+
- **Click-Through Rate**: 30-40%
- **Push Opt-in Rate**: 60-70%
- **User Engagement**: +25%
- **Daily Active Users**: +15%
- **Response Time**: <500ms

---

## 💰 ESTIMATED EFFORT

- **Phase 1**: 2-3 days (Database triggers)
- **Phase 2**: 1-2 days (Grouping)
- **Phase 3**: 3-4 days (UI components)
- **Phase 4**: 2-3 days (Push backend)
- **Phase 5**: 1-2 days (Preferences)
- **Phase 6**: 1 day (Cleanup & analytics)

**Total**: 10-15 days (2-3 weeks)

---

## 🔧 TECHNICAL REQUIREMENTS

- Supabase Edge Functions
- Web Push API
- Service Worker
- VAPID keys (already have)
- Cron jobs (pg_cron extension)
- Audio files for sounds

---

## 📝 NOTES

- Start with Phase 1 (triggers) for immediate value
- Test thoroughly in staging before production
- Monitor database performance with new triggers
- Consider rate limiting for notification creation
- Add unsubscribe option for push notifications
- Comply with notification permission best practices
