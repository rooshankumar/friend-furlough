# Chat Debug Guide

## Issue: Conversations not loading & Messages not sending

### Quick Debugging Steps:

1. **Open Browser Console** (F12)
2. **Navigate to /chat**
3. **Look for these errors:**
   - Supabase query errors
   - Type errors
   - Permission errors

### Common Issues & Fixes:

#### Issue 1: Empty conversations array
**Check**: Are there any conversations in your database?

```sql
-- Run in Supabase SQL Editor:
SELECT * FROM conversations;
SELECT * FROM conversation_participants WHERE user_id = 'your-user-id';
```

#### Issue 2: Messages not sending
**Check**: Do the tables exist?

```sql
-- Verify tables exist:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'messages', 'conversation_participants');
```

#### Issue 3: Permission errors
**Check**: RLS policies

```sql
-- Check RLS is enabled:
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'messages', 'conversation_participants');
```

### Manual Test in Browser Console:

```javascript
// 1. Check if user is authenticated
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);

// 2. Try to fetch conversations
const { data, error } = await supabase
  .from('conversation_participants')
  .select('*')
  .eq('user_id', user.id);
console.log('Conversations:', data, error);

// 3. Try to send a test message (if you have a conversation)
const { data: msg, error: msgError } = await supabase
  .from('messages')
  .insert({
    conversation_id: 'your-conversation-id',
    sender_id: user.id,
    content: 'Test message',
    type: 'text'
  })
  .select();
console.log('Message:', msg, msgError);
```

### Expected Errors & Solutions:

1. **"relation does not exist"**
   - Tables not created
   - Run database migrations

2. **"permission denied"**
   - RLS policies not set up correctly
   - Check RLS policies in Supabase

3. **"null value in column"**
   - Missing required field
   - Check table schema

4. **"No conversation_id"**
   - Need to create a conversation first
   - Use ExplorePage to start a chat

### Quick Fix: Create Test Conversation

```sql
-- 1. Create a conversation
INSERT INTO conversations (id) 
VALUES (gen_random_uuid()) 
RETURNING id;

-- 2. Add participants (use the id from step 1)
INSERT INTO conversation_participants (conversation_id, user_id)
VALUES 
  ('conversation-id-from-step-1', 'your-user-id'),
  ('conversation-id-from-step-1', 'other-user-id');
```

### Enable Debug Logs:

Add this to chatStore.ts temporarily:

```typescript
loadConversations: async (userId: string) => {
  console.log('🔍 Loading conversations for user:', userId);
  set({ isLoading: true });
  try {
    console.log('📡 Fetching from database...');
    const { data, error } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('user_id', userId);
    
    console.log('📊 Result:', { data, error });
    // ... rest of code
  }
}
```
