# 🚀 Quick Start - Priority Fixes

## 🔴 **FIX THESE FIRST** (Blocking Core Functionality)

### 1. Profile Languages & Interests Not Loading
**Issue**: Users profiles show empty arrays for languages and interests  
**Why**: `fetchProfiles.ts` doesn't join related tables  
**Fix**:
```typescript
// In src/integrations/supabase/fetchProfiles.ts
const { data, error } = await supabase
  .from('profiles')
  .select(`
    *,
    languages(*),
    cultural_interests(*)
  `)
```
**Impact**: 🔥 Explore, Matching, Profile pages all broken

---

### 2. Community Posts Using Wrong Table
**Issue**: Code uses both `community_posts` AND `posts` tables  
**Why**: Inconsistent implementation  
**Decision needed**: Pick one table to use  
**Recommendation**: Use `posts` (has reactions, comments built-in)  
**Impact**: 🔥 Community feed may show duplicate/missing posts

---

### 3. Onboarding Data Not Persisting
**Issue**: Users complete onboarding but data doesn't save to DB  
**Why**: Onboarding pages don't insert into `languages` and `cultural_interests` tables  
**Fix**: Add INSERT queries in `LearningGoalsPage.tsx` and `CulturalProfilePage.tsx`  
**Impact**: 🔥 New users can't complete registration

---

## 🟡 **FIX NEXT** (Poor User Experience)

### 4. Chat Loads Slowly
**Issue**: 5+ database queries per conversation  
**Fix**: Use JOIN queries instead of loops  
**Impact**: ⚠️ Bad UX, users wait 3-5 seconds

---

### 5. Image Uploads Not Working
**Issue**: Storage bucket exists but upload function incomplete  
**Fix**: Implement `src/lib/storage.ts`  
**Impact**: ⚠️ Users can't upload avatars or post images

---

### 6. No Error Messages for Users
**Issue**: Errors logged to console but users see nothing  
**Fix**: Add toast notifications for all errors  
**Impact**: ⚠️ Users confused when things fail

---

## 🟢 **POLISH LATER** (Enhancement)

### 7. Translation Feature
### 8. Cultural Events  
### 9. Voice Messages
### 10. Push Notifications

---

## 📋 **Quick Action Plan**

**Day 1-2**: Fix #1, #2, #3 (critical data issues)  
**Day 3-4**: Fix #4, #5 (performance & uploads)  
**Day 5-6**: Fix #6, polish UI  
**Week 2+**: Enhancement features

---

## 🛠️ **Development Commands**

```bash
# Start dev server
npm run dev

# Check for type errors
npx tsc --noEmit

# Run database migrations
# (Use Supabase dashboard or CLI)

# Build for production
npm run build
```

---

## 📂 **Key Files to Know**

**Stores** (State Management):
- `src/stores/authStore.ts` - User authentication
- `src/stores/chatStore.ts` - Messaging
- `src/stores/exploreStore.ts` - User discovery
- `src/stores/communityStore.ts` - Posts/feed

**Pages** (UI):
- `src/pages/ExplorePage.tsx` - Browse users
- `src/pages/ChatPage.tsx` - Messaging
- `src/pages/CommunityPage.tsx` - Social feed
- `src/pages/ProfilePage.tsx` - User profiles

**Data Layer**:
- `src/integrations/supabase/fetchProfiles.ts` ⚠️ NEEDS FIX
- `src/integrations/supabase/fetchProfileById.ts` ⚠️ NEEDS FIX
- `src/integrations/supabase/fetchCommunityPosts.ts` ⚠️ NEEDS FIX

**Database**:
- `supabase/migrations/*.sql` - Database schema

---

## 🐛 **Known Bugs**

1. ❌ Explore page shows users with no languages
2. ❌ Matching algorithm returns everyone (no filtering)
3. ❌ Community posts don't show author info
4. ❌ Chat takes 5+ seconds to load
5. ❌ Avatar upload fails silently
6. ❌ Onboarding redirect doesn't work

---

## ✅ **Working Features**

1. ✅ Authentication (Sign up/Sign in)
2. ✅ Basic messaging (send/receive)
3. ✅ Profile creation
4. ✅ Navigation
5. ✅ Real-time message updates
6. ✅ RLS policies (security)

---

**Start Here**: Fix issue #1 (Profile data fetching) - it unblocks 70% of features!
