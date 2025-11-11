-- Fix notifications to CASCADE delete when related_user is deleted
-- This prevents orphaned notifications from deleted users

-- Drop the existing foreign key constraint
ALTER TABLE public.notifications 
  DROP CONSTRAINT IF EXISTS notifications_related_user_id_fkey;

-- Re-add with CASCADE delete
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_related_user_id_fkey 
  FOREIGN KEY (related_user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;  -- Changed from SET NULL to CASCADE

-- Add comment
COMMENT ON CONSTRAINT notifications_related_user_id_fkey ON public.notifications 
  IS 'Delete notifications when the related user (actor) is deleted';
