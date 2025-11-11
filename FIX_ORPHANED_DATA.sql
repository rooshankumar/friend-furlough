-- ==========================================
-- COMPREHENSIVE FIX: Orphaned Data Cleanup
-- ==========================================
-- This script fixes foreign key constraints and cleans up orphaned data
-- Run these in order:

-- ==========================================
-- STEP 1: Fix notifications table
-- ==========================================

-- Drop existing constraint
ALTER TABLE public.notifications 
  DROP CONSTRAINT IF EXISTS notifications_related_user_id_fkey;

-- Re-add with CASCADE delete
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_related_user_id_fkey 
  FOREIGN KEY (related_user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- ==========================================
-- STEP 2: Clean up orphaned notifications
-- ==========================================

-- Delete notifications from deleted users (actor)
DELETE FROM public.notifications
WHERE related_user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = notifications.related_user_id
  );

-- Delete notifications for deleted users (recipient)
DELETE FROM public.notifications
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = notifications.user_id
  );

-- ==========================================
-- STEP 3: Check other tables for orphaned data
-- ==========================================

-- Clean up profile_views from deleted users
DELETE FROM public.profile_views
WHERE viewer_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = profile_views.viewer_id
  );

DELETE FROM public.profile_views
WHERE profile_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = profile_views.profile_id
  );

-- Clean up profile_reactions from deleted users
DELETE FROM public.profile_reactions
WHERE reactor_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = profile_reactions.reactor_id
  );

DELETE FROM public.profile_reactions
WHERE profile_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = profile_reactions.profile_id
  );

-- Clean up post_reactions from deleted users
DELETE FROM public.post_reactions
WHERE user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = post_reactions.user_id
  );

-- Clean up community_posts from deleted users
DELETE FROM public.community_posts
WHERE user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = community_posts.user_id
  );

-- ==========================================
-- STEP 4: Verify cleanup
-- ==========================================

-- Check for remaining orphaned data
SELECT 
  'notifications' as table_name,
  COUNT(*) as orphaned_count
FROM public.notifications
WHERE related_user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = notifications.related_user_id
  )
UNION ALL
SELECT 
  'profile_views' as table_name,
  COUNT(*) as orphaned_count
FROM public.profile_views
WHERE viewer_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = profile_views.viewer_id
  )
UNION ALL
SELECT 
  'profile_reactions' as table_name,
  COUNT(*) as orphaned_count
FROM public.profile_reactions
WHERE reactor_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = profile_reactions.reactor_id
  )
UNION ALL
SELECT 
  'post_reactions' as table_name,
  COUNT(*) as orphaned_count
FROM public.post_reactions
WHERE user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = post_reactions.user_id
  )
UNION ALL
SELECT 
  'community_posts' as table_name,
  COUNT(*) as orphaned_count
FROM public.community_posts
WHERE user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = community_posts.user_id
  );

-- ==========================================
-- SUMMARY
-- ==========================================
-- This script:
-- 1. ✅ Fixed notifications.related_user_id to CASCADE delete
-- 2. ✅ Cleaned up orphaned notifications
-- 3. ✅ Cleaned up orphaned profile_views
-- 4. ✅ Cleaned up orphaned profile_reactions
-- 5. ✅ Cleaned up orphaned post_reactions
-- 6. ✅ Cleaned up orphaned community_posts
-- 7. ✅ Verified no orphaned data remains
