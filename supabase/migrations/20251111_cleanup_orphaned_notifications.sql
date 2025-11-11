-- Clean up orphaned notifications from deleted users
-- Run this AFTER fixing the cascade constraint

-- Delete notifications where related_user_id points to a deleted user
DELETE FROM public.notifications
WHERE related_user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = notifications.related_user_id
  );

-- Also delete notifications for users that no longer exist (recipient deleted)
DELETE FROM public.notifications
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = notifications.user_id
  );

-- Log the cleanup
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Cleaned up % orphaned notifications', deleted_count;
END $$;
