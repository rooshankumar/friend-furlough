# Fix Storage Upload Timeout Issue

## Problem
Uploads are timing out after 10s and 20s attempts:
```
⚠ Attempt 1 failed: Timeout after 10s
⚠ Attempt 2 failed: Timeout after 20s
❌ Upload failed after all retries: Timeout after 20s
```

## Root Cause
The `chat-attachments` storage bucket may have:
1. Incorrect RLS policies blocking uploads
2. Misconfigured bucket settings
3. Network/CORS issues
4. File size limits too restrictive

## Solution: Recreate Storage Bucket

### Step 1: Backup Existing Files (Optional)
If you have important files in `chat-attachments`:
1. Go to Supabase Dashboard
2. Storage > chat-attachments
3. Download any files you want to keep

### Step 2: Delete Old Bucket

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to Supabase Dashboard
2. Navigate to **Storage**
3. Find `chat-attachments` bucket
4. Click the **...** menu
5. Select **Delete bucket**
6. Confirm deletion

**Option B: Via SQL**
```sql
-- Delete the bucket
DELETE FROM storage.buckets WHERE id = 'chat-attachments';
```

### Step 3: Create New Bucket

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to Supabase Dashboard
2. Navigate to **Storage**
3. Click **New bucket**
4. Settings:
   - **Name:** `chat-attachments`
   - **Public bucket:** ✅ Yes (checked)
   - **File size limit:** `20971520` (20MB)
   - **Allowed MIME types:** 
     ```
     image/jpeg, image/jpg, image/png, image/gif, image/webp,
     video/mp4, video/quicktime, video/webm,
     audio/mpeg, audio/mp3, audio/wav, audio/webm, audio/ogg,
     application/pdf, application/msword,
     application/vnd.openxmlformats-officedocument.wordprocessingml.document,
     text/plain
     ```
5. Click **Create bucket**

**Option B: Via SQL**
```sql
-- Create new bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  true,  -- Public bucket
  20971520,  -- 20MB
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/quicktime', 'video/webm',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
);
```

### Step 4: Set Up RLS Policies

**Via Supabase Dashboard:**
1. Go to **Storage** > `chat-attachments`
2. Click **Policies** tab
3. Add these policies:

**Policy 1: Upload**
- Name: `Authenticated users can upload`
- Target roles: `authenticated`
- Policy command: `INSERT`
- Policy definition:
  ```sql
  bucket_id = 'chat-attachments'
  ```

**Policy 2: Read**
- Name: `Public read access`
- Target roles: `public`
- Policy command: `SELECT`
- Policy definition:
  ```sql
  bucket_id = 'chat-attachments'
  ```

**Policy 3: Delete**
- Name: `Users can delete their files`
- Target roles: `authenticated`
- Policy command: `DELETE`
- Policy definition:
  ```sql
  bucket_id = 'chat-attachments'
  AND EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = (storage.foldername(name))[1]::uuid
    AND user_id = auth.uid()
  )
  ```

**Via SQL (All at once):**
```sql
-- Policy 1: Upload
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

-- Policy 2: Read
CREATE POLICY "Public read access for chat attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'chat-attachments');

-- Policy 3: Delete
CREATE POLICY "Users can delete their conversation attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = (storage.foldername(name))[1]::uuid
    AND user_id = auth.uid()
  )
);
```

### Step 5: Verify Setup

**Check bucket exists:**
```sql
SELECT * FROM storage.buckets WHERE id = 'chat-attachments';
```

Expected result:
```
id: chat-attachments
name: chat-attachments
public: true
file_size_limit: 20971520
allowed_mime_types: [array of mime types]
```

**Check policies:**
```sql
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%chat%';
```

Expected result: 3 policies (INSERT, SELECT, DELETE)

### Step 6: Test Upload

1. Open your app in Chrome mobile
2. Go to chat
3. Click attachment button
4. Select a small image (< 1MB)
5. Watch console logs:
   ```
   📱 Mobile file selected: { name: '...', size: '...MB', type: '...' }
   📤 Starting mobile upload: ...
   📊 Upload progress: 10%
   📊 Upload progress: 30%
   ...
   ✅ Upload complete: https://...
   ✅ Message sent with media: ...
   ```

### Step 7: If Still Timing Out

**Check Network:**
1. Test internet speed on mobile
2. Try on WiFi vs mobile data
3. Check if Supabase is accessible

**Increase Timeout:**
Edit `src/lib/storage.ts`:
```typescript
// Change timeout values
const timeout = attempt === 1 ? 30000 : 60000; // 30s then 60s
```

**Check CORS:**
1. Go to Supabase Dashboard
2. Settings > API
3. Check CORS settings
4. Add your domain if needed

**Try Smaller File:**
1. Select a very small image (< 100KB)
2. If it works, issue is file size/compression
3. Adjust compression settings

### Step 8: Alternative - Use Different Bucket Name

If `chat-attachments` is problematic, create a new bucket:

```sql
-- Create with different name
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'chat-files',  -- Different name
  'chat-files',
  true,
  20971520
);
```

Then update your code:
```typescript
// In src/lib/storage.ts
const { data, error } = await supabase.storage
  .from('chat-files')  // Change bucket name
  .upload(fileName, fileToUpload, {
    cacheControl: '3600',
    upsert: true
  });
```

## Quick Fix Script

Run this in Supabase SQL Editor:

```sql
-- Complete setup in one go
BEGIN;

-- Delete old bucket (if exists)
DELETE FROM storage.buckets WHERE id = 'chat-attachments';

-- Create new bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  true,
  20971520,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/quicktime', 'video/webm',
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain']
);

-- Add policies
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Public read access for chat attachments"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Users can delete their conversation attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = (storage.foldername(name))[1]::uuid
    AND user_id = auth.uid()
  )
);

COMMIT;

-- Verify
SELECT * FROM storage.buckets WHERE id = 'chat-attachments';
```

## Expected Result

After setup, uploads should work:
```
📱 Mobile file selected: { name: 'photo.jpg', size: '0.38MB', type: 'image/jpeg' }
📤 Starting mobile upload: photo.jpg
📊 Upload progress: 10%
📊 Upload progress: 30%
📊 Upload progress: 60%
📊 Upload progress: 80%
✅ Uploaded (attempt 1): https://bblrxervgwkphkctdghe.supabase.co/storage/v1/object/public/chat-attachments/...
✅ Message sent with media: ...
```

## Troubleshooting

### Still timing out?
1. Check Supabase project status (not paused)
2. Check API key is correct
3. Try uploading via Supabase Dashboard manually
4. Check browser console for CORS errors
5. Test on different network (WiFi vs mobile data)

### Upload works but file not visible?
1. Check bucket is public
2. Check file URL is correct
3. Check RLS policies allow SELECT

### Permission denied?
1. Check user is authenticated
2. Check RLS policies are correct
3. Check user is participant in conversation

## Summary

1. ✅ Delete old `chat-attachments` bucket
2. ✅ Create new `chat-attachments` bucket (public, 20MB limit)
3. ✅ Add RLS policies (INSERT, SELECT, DELETE)
4. ✅ Test upload from app
5. ✅ Verify file appears in storage

**Status:** Ready to fix storage timeout issue! 🚀
