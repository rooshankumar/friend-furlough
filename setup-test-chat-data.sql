-- Setup test chat data for Friend Furlough app
-- Run this in Supabase SQL Editor to create test conversations and messages

-- First, let's check if we have any users in profiles table
-- You'll need to replace these UUIDs with actual user IDs from your profiles table

-- Create test conversations (replace user IDs with actual ones from your profiles table)
-- To get user IDs, first run: SELECT id, name, email FROM auth.users LIMIT 5;
-- Then run: SELECT id, name FROM profiles LIMIT 5;

-- Example conversation 1: Language exchange
INSERT INTO conversations (id, is_language_exchange, language, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', true, 'Spanish', now() - interval '2 days', now() - interval '1 hour')
ON CONFLICT (id) DO NOTHING;

-- Example conversation 2: Cultural chat
INSERT INTO conversations (id, is_language_exchange, language, created_at, updated_at)
VALUES 
  ('22222222-2222-2222-2222-222222222222', false, null, now() - interval '1 day', now() - interval '30 minutes')
ON CONFLICT (id) DO NOTHING;

-- Add conversation participants
-- NOTE: Replace these user IDs with actual user IDs from your profiles table
-- You can get them by running: SELECT id, name FROM profiles ORDER BY created_at LIMIT 10;

-- For conversation 1 (replace with actual user IDs)
INSERT INTO conversation_participants (conversation_id, user_id, unread_count, joined_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM profiles LIMIT 1 OFFSET 0), 2, now() - interval '2 days'),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM profiles LIMIT 1 OFFSET 1), 0, now() - interval '2 days')
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- For conversation 2 (replace with actual user IDs)
INSERT INTO conversation_participants (conversation_id, user_id, unread_count, joined_at)
VALUES 
  ('22222222-2222-2222-2222-222222222222', (SELECT id FROM profiles LIMIT 1 OFFSET 0), 1, now() - interval '1 day'),
  ('22222222-2222-2222-2222-222222222222', (SELECT id FROM profiles LIMIT 1 OFFSET 2), 0, now() - interval '1 day')
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- Add test messages
-- For conversation 1
INSERT INTO messages (conversation_id, sender_id, content, type, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM profiles LIMIT 1 OFFSET 0), '¡Hola! ¿Cómo estás?', 'text', now() - interval '2 hours'),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM profiles LIMIT 1 OFFSET 1), 'Hello! I''m doing well, thanks! How are you?', 'text', now() - interval '1 hour 45 minutes'),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM profiles LIMIT 1 OFFSET 0), 'Muy bien, gracias. I''m practicing my Spanish!', 'text', now() - interval '1 hour 30 minutes'),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM profiles LIMIT 1 OFFSET 1), 'That''s great! Your Spanish is improving. ¿Te gusta aprender español?', 'text', now() - interval '1 hour 15 minutes'),
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM profiles LIMIT 1 OFFSET 0), 'Sí, me gusta mucho! It''s challenging but fun.', 'text', now() - interval '1 hour');

-- For conversation 2
INSERT INTO messages (conversation_id, sender_id, content, type, created_at)
VALUES 
  ('22222222-2222-2222-2222-222222222222', (SELECT id FROM profiles LIMIT 1 OFFSET 0), 'Hey! How''s your day going?', 'text', now() - interval '45 minutes'),
  ('22222222-2222-2222-2222-222222222222', (SELECT id FROM profiles LIMIT 1 OFFSET 2), 'Pretty good! Just finished work. What about you?', 'text', now() - interval '40 minutes'),
  ('22222222-2222-2222-2222-222222222222', (SELECT id FROM profiles LIMIT 1 OFFSET 0), 'Same here! Want to grab coffee sometime this week?', 'text', now() - interval '35 minutes'),
  ('22222222-2222-2222-2222-222222222222', (SELECT id FROM profiles LIMIT 1 OFFSET 2), 'That sounds great! How about Thursday afternoon?', 'text', now() - interval '30 minutes');

-- Update conversation updated_at timestamps to reflect latest messages
UPDATE conversations 
SET updated_at = (
  SELECT MAX(created_at) 
  FROM messages 
  WHERE messages.conversation_id = conversations.id
)
WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

-- Check the results
SELECT 'Conversations created:' as info;
SELECT id, is_language_exchange, language, created_at FROM conversations;

SELECT 'Participants added:' as info;
SELECT cp.conversation_id, p.name as participant_name, cp.unread_count 
FROM conversation_participants cp
JOIN profiles p ON cp.user_id = p.id;

SELECT 'Messages created:' as info;
SELECT m.conversation_id, p.name as sender_name, m.content, m.created_at
FROM messages m
JOIN profiles p ON m.sender_id = p.id
ORDER BY m.created_at;

-- Instructions for manual setup:
-- 1. First, check your profiles: SELECT id, name FROM profiles;
-- 2. Replace the OFFSET values above with specific user IDs
-- 3. Or create the conversations manually with your actual user IDs
