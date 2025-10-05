-- Add indexes for better performance on frequently queried tables
CREATE INDEX IF NOT EXISTS idx_profiles_online ON public.profiles(online) WHERE online = true;
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);

-- Optimize profiles table with better defaults
ALTER TABLE public.profiles 
  ALTER COLUMN online SET DEFAULT false,
  ALTER COLUMN last_seen SET DEFAULT now();

-- Add composite index for chat queries
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_conversation 
  ON public.conversation_participants(user_id, conversation_id);