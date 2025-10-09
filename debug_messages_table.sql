-- Debug messages table and permissions
-- Run this in Supabase SQL Editor to check what's wrong

-- 1. Check if messages table exists and its structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check RLS policies on messages table
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'messages';

-- 3. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'messages';

-- 4. Test direct insert (replace with your actual user ID)
-- Get your user ID first:
SELECT auth.uid() as current_user_id;

-- 5. Check if you have any conversations
SELECT id, created_at FROM conversations LIMIT 5;

-- 6. Check conversation participants for your user
SELECT 
  cp.conversation_id,
  cp.user_id,
  c.id as conv_id
FROM conversation_participants cp
JOIN conversations c ON cp.conversation_id = c.id
WHERE cp.user_id = auth.uid()
LIMIT 5;

-- 7. Try a test insert (replace conversation_id with actual one from step 6)
-- INSERT INTO messages (conversation_id, sender_id, content, type)
-- VALUES ('your-conversation-id-here', auth.uid(), 'Test message from SQL', 'text');

-- 8. Check recent messages
SELECT 
  id,
  conversation_id,
  sender_id,
  content,
  type,
  created_at
FROM messages 
ORDER BY created_at DESC 
LIMIT 10;
