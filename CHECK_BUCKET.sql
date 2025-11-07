-- Check if chat_files bucket is PUBLIC
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'chat_files';

-- Expected result:
-- id: chat_files
-- name: chat_files
-- public: TRUE  <-- MUST BE TRUE!
-- file_size_limit: 20971520 (or NULL)

-- If public is FALSE, run this:
UPDATE storage.buckets 
SET public = true 
WHERE id = 'chat_files';
