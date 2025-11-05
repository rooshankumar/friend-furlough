-- Add performance indexes for frequently queried columns

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
  ON public.messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender 
  ON public.messages(sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_client_id
  ON public.messages(client_id) WHERE client_id IS NOT NULL;

-- Conversation participants index
CREATE INDEX IF NOT EXISTS idx_conv_participants_user 
  ON public.conversation_participants(user_id, conversation_id);

CREATE INDEX IF NOT EXISTS idx_conv_participants_unread
  ON public.conversation_participants(user_id, unread_count) WHERE unread_count > 0;

-- Community posts indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_user_created 
  ON public.community_posts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_posts_created
  ON public.community_posts(created_at DESC);

-- Post reactions and comments indexes
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_user
  ON public.post_reactions(post_id, user_id);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_created
  ON public.post_comments(post_id, created_at DESC);

-- Profile reactions index
CREATE INDEX IF NOT EXISTS idx_profile_reactions_profile_reactor
  ON public.profile_reactions(profile_id, reactor_id);

-- Friend requests indexes
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_status
  ON public.friend_requests(receiver_id, status);

CREATE INDEX IF NOT EXISTS idx_friend_requests_sender
  ON public.friend_requests(sender_id, created_at DESC);

-- Friendships composite index
CREATE INDEX IF NOT EXISTS idx_friendships_users
  ON public.friendships(user1_id, user2_id);

-- Languages user index
CREATE INDEX IF NOT EXISTS idx_languages_user
  ON public.languages(user_id);