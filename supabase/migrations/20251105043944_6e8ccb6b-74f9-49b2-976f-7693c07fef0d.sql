-- Phase 2: Fix Critical Security Issues

-- 1. Enable RLS on conversation_participants
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- 2. Add RLS policies for conversation_participants
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'conversation_participants' 
    AND policyname = 'participants_select_own'
  ) THEN
    CREATE POLICY "participants_select_own" 
    ON public.conversation_participants 
    FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'conversation_participants' 
    AND policyname = 'participants_insert_own'
  ) THEN
    CREATE POLICY "participants_insert_own" 
    ON public.conversation_participants 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'conversation_participants' 
    AND policyname = 'participants_update_own'
  ) THEN
    CREATE POLICY "participants_update_own" 
    ON public.conversation_participants 
    FOR UPDATE 
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- 3. Fix search_path for security definer functions
ALTER FUNCTION public.are_friends(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.get_friend_request_status(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.get_profile_reaction_count(uuid, text) SET search_path = public;
ALTER FUNCTION public.has_user_reacted_to_profile(uuid, uuid, text) SET search_path = public;
ALTER FUNCTION public.get_post_reaction_count(uuid, text) SET search_path = public;
ALTER FUNCTION public.get_post_comment_count(uuid) SET search_path = public;
ALTER FUNCTION public.has_user_reacted_to_post(uuid, uuid, text) SET search_path = public;
ALTER FUNCTION public.handle_friend_request_update() SET search_path = public;
ALTER FUNCTION public.increment_unread_count() SET search_path = public;
ALTER FUNCTION public.reset_unread_count_on_read() SET search_path = public;