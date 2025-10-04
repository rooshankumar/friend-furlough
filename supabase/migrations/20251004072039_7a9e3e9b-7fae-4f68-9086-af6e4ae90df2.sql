-- Fix infinite recursion in conversation_participants RLS policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Participants can view conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;

-- Create fixed policies for conversation_participants
-- Users can view participants of conversations they are part of
CREATE POLICY "Users can view conversation participants"
  ON public.conversation_participants
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Create fixed policy for conversations
-- Users can view conversations they are part of
CREATE POLICY "Users can view their conversations"
  ON public.conversations
  FOR SELECT
  USING (
    id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );
