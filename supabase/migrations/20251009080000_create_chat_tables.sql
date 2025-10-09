-- Create core chat tables for Friend Furlough app
-- This migration creates the conversations, messages, conversation_participants, and message_reads tables

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_language_exchange BOOLEAN DEFAULT false,
  language TEXT,
  user_id UUID -- Optional: creator of the conversation
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Add trigger for updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- CONVERSATION_PARTICIPANTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  unread_count INTEGER DEFAULT 0,
  UNIQUE(conversation_id, user_id)
);

-- Enable RLS
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- MESSAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'voice')),
  language TEXT,
  translation TEXT,
  media_url TEXT,
  client_id TEXT -- For idempotency and optimistic updates
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- MESSAGE_READS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.message_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON public.message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON public.message_reads(user_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Conversations policies
CREATE POLICY "conversations_insert_policy"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "conversations_select_policy"
ON public.conversations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "conversations_update_policy"
ON public.conversations
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "conversations_delete_policy"
ON public.conversations
FOR DELETE
TO authenticated
USING (true);

-- Conversation participants policies
CREATE POLICY "participants_insert_policy"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "participants_select_policy"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "participants_update_policy"
ON public.conversation_participants
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "participants_delete_policy"
ON public.conversation_participants
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Messages policies
CREATE POLICY "messages_insert_policy"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_select_policy"
ON public.messages
FOR SELECT
TO authenticated
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "messages_update_policy"
ON public.messages
FOR UPDATE
TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_delete_policy"
ON public.messages
FOR DELETE
TO authenticated
USING (sender_id = auth.uid());

-- Message reads policies
CREATE POLICY "message_reads_insert_policy"
ON public.message_reads
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "message_reads_select_policy"
ON public.message_reads
FOR SELECT
TO authenticated
USING (
  message_id IN (
    SELECT id FROM public.messages 
    WHERE conversation_id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "message_reads_update_policy"
ON public.message_reads
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "message_reads_delete_policy"
ON public.message_reads
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- ENABLE REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reads;
