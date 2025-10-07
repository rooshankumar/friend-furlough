# 🔧 Chat Troubleshooting Guide

## Issue: Conversations not loading & Messages not sending

### Step 1: Check Browser Console

1. Open your app at `http://localhost:5173/chat`
2. Open browser console (F12 or right-click → Inspect → Console)
3. Look for the emoji logs I just added:
   - 📡 Loading conversations...
   - 📊 Results
   - ❌ Errors
   - ✅ Success messages

### Step 2: Common Issues & Solutions

#### Problem 1: "No conversations found"

**Cause**: You don't have any conversations yet

**Solution**: Create a conversation first
1. Go to `/explore`
2. Click "Start Chat" on any user profile
3. Check console for conversation creation logs
4. Go back to `/chat`

#### Problem 2: Database table errors

**Check if tables exist:**

Run in Supabase SQL Editor:
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'messages', 'conversation_participants');
```

**Should return 3 rows. If not, run these migrations:**

```sql
-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_language_exchange BOOLEAN DEFAULT false,
  language TEXT
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  language TEXT,
  translation TEXT,
  media_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversation_participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unread_count INTEGER DEFAULT 0,
  UNIQUE(conversation_id, user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_conversation ON conversation_participants(conversation_id);
```

#### Problem 3: RLS Permission Errors

**Check console for errors like:**
- "new row violates row-level security policy"
- "permission denied for table"

**Solution: Set up RLS policies:**

```sql
-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view conversations they're in"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Conversation participants policies
CREATE POLICY "Users can view participants in their conversations"
  ON conversation_participants FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add participants"
  ON conversation_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

#### Problem 4: User not authenticated

**Check console for:**
```
📡 Loading conversations for user: undefined
```

**Solution:**
1. Make sure you're logged in
2. Check auth state:
```javascript
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

### Step 3: Manual Database Check

**Check if you have conversations:**
```sql
-- See all conversations
SELECT * FROM conversations;

-- See your conversations (replace with your user ID)
SELECT cp.*, c.* 
FROM conversation_participants cp
JOIN conversations c ON c.id = cp.conversation_id
WHERE cp.user_id = 'your-user-id-here';

-- See all messages
SELECT * FROM messages ORDER BY created_at DESC LIMIT 10;
```

### Step 4: Test in Browser Console

```javascript
// Get current user
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);

// Test fetching conversations
const { data: participants, error: pError } = await supabase
  .from('conversation_participants')
  .select('*')
  .eq('user_id', user.id);
console.log('My conversations:', participants, pError);

// Test fetching messages (use a conversation_id from above)
const { data: messages, error: mError } = await supabase
  .from('messages')
  .select('*')
  .eq('conversation_id', 'conversation-id-here')
  .order('created_at', { ascending: false });
console.log('Messages:', messages, mError);

// Test sending a message
const { data: newMsg, error: sendError } = await supabase
  .from('messages')
  .insert({
    conversation_id: 'conversation-id-here',
    sender_id: user.id,
    content: 'Test message',
    type: 'text'
  })
  .select()
  .single();
console.log('Sent message:', newMsg, sendError);
```

### Step 5: Check Network Tab

1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Try to load conversations
4. Look for requests to Supabase
5. Check response status (should be 200)
6. Check response data

### Expected Console Output (Healthy):

```
📡 Loading conversations for user: abc-123-def...
📊 User participants: { data: [...], error: null }
📊 All participants: { data: [...], error: null }
📊 Last messages: { data: [...], error: null }
✅ Generated 5 suggested matches
```

### Common Error Messages:

**Error 1: "relation does not exist"**
→ Tables not created. Run migrations above.

**Error 2: "permission denied"**
→ RLS policies missing. Run RLS policies above.

**Error 3: "null value in column"**
→ Required field missing. Check your insert data.

**Error 4: "No conversation_id"**
→ Create a conversation first via /explore

### Still Not Working?

**Share these details:**
1. Console logs (copy from browser console)
2. Network tab errors
3. SQL query results
4. Error messages

**Quick Reset (if needed):**
```sql
-- ⚠️ WARNING: This deletes ALL chat data
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE conversation_participants CASCADE;
TRUNCATE TABLE conversations CASCADE;
```

Then create a fresh conversation via /explore.

### Success Checklist:

- [ ] Tables exist in database
- [ ] RLS policies are set up
- [ ] User is authenticated
- [ ] At least one conversation exists
- [ ] Console shows success logs (✅)
- [ ] No errors in console (❌)
- [ ] Network requests return 200
- [ ] Messages array has data
