# Chat Files Bucket Setup ✅

## New Bucket: `chat_files`

The app now uses the new `chat_files` bucket for all chat attachments.

## Bucket Configuration

### Required Settings

**Via Supabase Dashboard:**
1. Go to **Storage** > `chat_files`
2. Settings:
   - **Name:** `chat_files`
   - **Public bucket:** ✅ Yes (must be checked)
   - **File size limit:** `20971520` (20MB)
   - **Allowed MIME types:** Leave empty or add:
     ```
     image/jpeg, image/jpg, image/png, image/gif, image/webp,
     video/mp4, video/quicktime, video/webm,
     audio/mpeg, audio/mp3, audio/wav, audio/webm, audio/ogg,
     application/pdf, application/msword,
     application/vnd.openxmlformats-officedocument.wordprocessingml.document,
     text/plain
     ```

### Required RLS Policies

**Policy 1: Allow Upload (INSERT)**
- Name: `Authenticated users can upload`
- Target roles: `authenticated`
- Policy command: `INSERT`
- Policy definition:
  ```sql
  bucket_id = 'chat_files'
  ```

**Policy 2: Allow Read (SELECT)**
- Name: `Public read access`
- Target roles: `public`
- Policy command: `SELECT`
- Policy definition:
  ```sql
  bucket_id = 'chat_files'
  ```

**Policy 3: Allow Delete (DELETE)**
- Name: `Users can delete their files`
- Target roles: `authenticated`
- Policy command: `DELETE`
- Policy definition:
  ```sql
  bucket_id = 'chat_files'
  AND EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = (storage.foldername(name))[1]::uuid
    AND user_id = auth.uid()
  )
  ```

## SQL Setup (Quick)

Run this in Supabase SQL Editor:

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'chat_files',
  'chat_files',
  true,
  20971520  -- 20MB
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 20971520;

-- Add RLS policies
CREATE POLICY "Authenticated users can upload to chat_files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat_files');

CREATE POLICY "Public read access for chat_files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'chat_files');

CREATE POLICY "Users can delete their chat_files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat_files'
  AND EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = (storage.foldername(name))[1]::uuid
    AND user_id = auth.uid()
  )
);
```

## Verification

### Check Bucket Exists
```sql
SELECT * FROM storage.buckets WHERE id = 'chat_files';
```

Expected result:
```
id: chat_files
name: chat_files
public: true
file_size_limit: 20971520
```

### Check Policies
```sql
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%chat_files%';
```

Expected result: 3 policies (INSERT, SELECT, DELETE)

## Code Changes

### Updated File: `src/lib/storage.ts`

**Before:**
```typescript
const { data, error } = await supabase.storage
  .from('chat-attachments')  // Old bucket
  .upload(fileName, file);
```

**After:**
```typescript
const { data, error } = await supabase.storage
  .from('chat_files')  // New bucket ✅
  .upload(fileName, file);
```

## File Structure

Files are organized by conversation:
```
chat_files/
├── conversation-id-1/
│   ├── 1730000000000_photo1.jpg
│   ├── 1730000001000_photo2.jpg
│   └── 1730000002000_document.pdf
├── conversation-id-2/
│   ├── 1730000003000_video.mp4
│   └── 1730000004000_audio.mp3
└── conversation-id-3/
    └── 1730000005000_file.txt
```

## Testing

1. **Build and sync:**
   ```bash
   npm run build
   npx cap sync android
   ```

2. **Test upload:**
   - Open chat
   - Click attachment button
   - Select a file
   - Check console logs:
     ```
     📤 Simple upload: photo.jpg (0.38MB)
     ✅ Upload complete: https://...supabase.co/storage/v1/object/public/chat_files/...
     ```

3. **Verify in Supabase:**
   - Go to Storage > chat_files
   - Should see your uploaded file
   - Click file to view public URL

## Expected URL Format

```
https://bblrxervgwkphkctdghe.supabase.co/storage/v1/object/public/chat_files/conversation-id/timestamp_filename.ext
```

Example:
```
https://bblrxervgwkphkctdghe.supabase.co/storage/v1/object/public/chat_files/275be6e3-8790-4b05-9a10-91c80c93098b/1730000000000_photo.jpg
```

## Troubleshooting

### Upload fails with "Bucket not found"
- Check bucket exists: `SELECT * FROM storage.buckets WHERE id = 'chat_files';`
- Create bucket if missing (see SQL above)

### Upload fails with "Access denied"
- Check RLS policies exist
- Check user is authenticated
- Check bucket is public

### File uploads but not visible
- Check bucket is public: `public = true`
- Check SELECT policy exists for `public` role
- Check file URL is correct

### Cannot delete files
- Check DELETE policy exists
- Check user is participant in conversation
- Check `conversation_participants` table has correct data

## Migration from Old Bucket

If you have files in `chat-attachments` bucket:

### Option 1: Keep Both Buckets
- Old messages use `chat-attachments`
- New messages use `chat_files`
- No migration needed

### Option 2: Migrate Files
```sql
-- Copy files from old bucket to new bucket
-- (This is a manual process via Supabase Dashboard)
-- 1. Download files from chat-attachments
-- 2. Upload to chat_files with same path structure
```

### Option 3: Update Old URLs
```sql
-- Update old message URLs (if needed)
UPDATE messages
SET media_url = REPLACE(media_url, '/chat-attachments/', '/chat_files/')
WHERE media_url LIKE '%/chat-attachments/%';
```

## Summary

✅ **Bucket name:** `chat_files`
✅ **Public:** Yes
✅ **File size limit:** 20MB
✅ **RLS policies:** 3 (INSERT, SELECT, DELETE)
✅ **Code updated:** `src/lib/storage.ts`

**Next steps:**
1. Verify bucket exists and is public
2. Verify RLS policies are set
3. Build and test upload
4. Check file appears in storage
5. Verify public URL works

🚀 **Ready to test with new bucket!**
