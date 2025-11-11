# Orphaned Data Cleanup - Fix Guide

## Problem
When users are deleted, their activities (notifications, profile views, reactions, etc.) remain in the database, showing "Unknown User" to other users.

## Root Cause
The `notifications.related_user_id` foreign key was set to `ON DELETE SET NULL` instead of `ON DELETE CASCADE`, causing notifications to remain when the actor (related user) is deleted.

## Solution

### Files Created
1. **FIX_ORPHANED_DATA.sql** - Comprehensive cleanup script
2. **supabase/migrations/20251111_fix_notifications_cascade.sql** - Fix notifications constraint
3. **supabase/migrations/20251111_cleanup_orphaned_notifications.sql** - Clean orphaned notifications

### What Gets Fixed

#### 1. Notifications Table
- **Before**: `related_user_id` → `ON DELETE SET NULL` (notification stays, user becomes NULL)
- **After**: `related_user_id` → `ON DELETE CASCADE` (notification deleted with user)

#### 2. Orphaned Data Cleanup
Removes orphaned records from:
- ✅ `notifications` (from deleted actors)
- ✅ `profile_views` (from deleted viewers)
- ✅ `profile_reactions` (from deleted reactors)
- ✅ `post_reactions` (from deleted users)
- ✅ `community_posts` (from deleted authors)

## How to Apply

### Option 1: Run Full Cleanup (Recommended)
```sql
-- Run the comprehensive script
-- This fixes constraints AND cleans up orphaned data
\i FIX_ORPHANED_DATA.sql
```

### Option 2: Run Migrations Separately
```bash
# Apply migrations in order
psql -f supabase/migrations/20251111_fix_notifications_cascade.sql
psql -f supabase/migrations/20251111_cleanup_orphaned_notifications.sql
```

### Option 3: Via Supabase Dashboard
1. Go to SQL Editor
2. Copy contents of `FIX_ORPHANED_DATA.sql`
3. Run the script
4. Check the verification results at the end

## Verification

After running the script, check for remaining orphaned data:

```sql
-- Should return 0 for all tables
SELECT 
  'notifications' as table_name,
  COUNT(*) as orphaned_count
FROM public.notifications
WHERE related_user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = notifications.related_user_id
  );
```

## Impact

### Before Fix
- ❌ Deleted user notifications remain
- ❌ Shows "Unknown User" in notifications
- ❌ Orphaned profile views clutter database
- ❌ Orphaned reactions remain

### After Fix
- ✅ Notifications auto-delete when user is deleted
- ✅ No "Unknown User" notifications
- ✅ Clean database with no orphaned data
- ✅ Better user experience

## Tables Affected

| Table | Foreign Key | Action |
|-------|-------------|--------|
| notifications | related_user_id | Changed to CASCADE |
| profile_views | viewer_id | Cleaned up orphans |
| profile_reactions | reactor_id | Cleaned up orphans |
| post_reactions | user_id | Cleaned up orphans |
| community_posts | user_id | Cleaned up orphans |

## Testing

1. **Create a test user**
2. **Have them create notifications** (send message, like post, etc.)
3. **Delete the test user**
4. **Check notifications** - Should be automatically deleted
5. **Verify no "Unknown User"** notifications remain

## Rollback (If Needed)

If you need to revert the constraint change:

```sql
-- Revert to SET NULL (not recommended)
ALTER TABLE public.notifications 
  DROP CONSTRAINT IF EXISTS notifications_related_user_id_fkey;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_related_user_id_fkey 
  FOREIGN KEY (related_user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE SET NULL;
```

## Related Issues

- User deletion cleanup
- Notification system improvements
- Database integrity
- Foreign key constraints

## Status
✅ **Ready to Deploy**

All scripts tested and ready to run on production database.
