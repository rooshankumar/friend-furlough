# Friend Furlough (roshLingua) - Core Features Fix TODO List

## 🔴 **CRITICAL - Database & Data Layer Issues**

### 1. Profile Data Fetching - **HIGH PRIORITY**
**Problem**: User profiles are incomplete - languages and cultural interests stored in separate tables but not being fetched
- [ ] Fix `fetchProfiles.ts` to join and fetch data from `languages` table
- [ ] Fix `fetchProfiles.ts` to join and fetch data from `cultural_interests` table
- [ ] Update `fetchProfileById.ts` to properly fetch languages and interests
- [ ] Ensure proper mapping of `is_native` and `is_learning` flags to `nativeLanguages` and `learningLanguages` arrays
- [ ] Add proper error handling for missing profile data
- [ ] **Impact**: Explore page, Profile page, Matching algorithm all broken

**Files to modify**:
- `src/integrations/supabase/fetchProfiles.ts`
- `src/integrations/supabase/fetchProfileById.ts`

---

### 2. Community Posts Confusion - **HIGH PRIORITY**
**Problem**: Two different post tables exist - `community_posts` and `posts` - causing confusion
- [ ] Decide which table to use as primary: `community_posts` (simple) vs `posts` (complex with reactions/comments)
- [ ] Update `CommunityPage.tsx` to use consistent table
- [ ] Update `fetchCommunityPosts.ts` to use correct table
- [ ] Migrate data if needed or drop unused table
- [ ] Add proper reactions, comments, and share functionality
- [ ] **Current State**: CommunityPage uses `community_posts`, fetchCommunityPosts uses `posts`

**Files to modify**:
- `src/pages/CommunityPage.tsx`
- `src/integrations/supabase/fetchCommunityPosts.ts`
- `src/stores/communityStore.ts`
- Database migration may be needed

---

### 3. Chat System Performance - **MEDIUM PRIORITY**
**Problem**: Chat store makes multiple sequential DB calls, causing slow load times
- [ ] Optimize `loadConversations` to use JOIN queries instead of loops
- [ ] Reduce N+1 query problem when fetching participants
- [ ] Add caching for frequently accessed conversations
- [ ] Implement pagination for messages (currently loads all messages)
- [ ] Add loading states for better UX
- [ ] Handle edge cases (empty conversations, deleted users)

**Files to modify**:
- `src/stores/chatStore.ts`

---

## 🟡 **HIGH PRIORITY - Feature Completion**

### 4. Onboarding Flow Completion
**Problem**: Onboarding saves data to separate tables but profile remains incomplete
- [ ] Ensure `LearningGoalsPage` saves to `languages` table with proper flags
- [ ] Ensure `CulturalProfilePage` saves to `cultural_interests` table
- [ ] Add validation to prevent incomplete profiles
- [ ] Set `onboarding_completed` flag in profiles table after completion
- [ ] Add ability to edit onboarding data later from Settings
- [ ] Fix redirect logic after onboarding

**Files to modify**:
- `src/pages/onboarding/LearningGoalsPage.tsx`
- `src/pages/onboarding/CulturalProfilePage.tsx`
- `src/stores/authStore.ts`

---

### 5. Image Upload Implementation - **MEDIUM PRIORITY**
**Problem**: Storage buckets configured but image upload not fully working
- [ ] Complete `uploadPostImage` implementation in `src/lib/storage.ts`
- [ ] Add avatar upload functionality in Settings page
- [ ] Add post image upload in Community page
- [ ] Implement image compression before upload
- [ ] Add proper error handling for storage quota/size limits
- [ ] Add image preview and delete functionality

**Files to check/modify**:
- `src/lib/storage.ts` (may not exist)
- `src/pages/SettingsPage.tsx`
- `src/pages/CommunityPage.tsx`

---

### 6. Language Exchange Matching Algorithm - **MEDIUM PRIORITY**
**Problem**: Matching algorithm exists but uses incomplete data
- [ ] Fix `getSuggestedMatches` in `exploreStore.ts` to use real language data
- [ ] Implement proper scoring algorithm for language exchange
- [ ] Add "Perfect Match" badge for mutual language exchange
- [ ] Display match reasons to users
- [ ] Save user preferences for match filters
- [ ] Add "Connect" or "Message" CTA on match cards

**Files to modify**:
- `src/stores/exploreStore.ts`
- `src/pages/ExplorePage.tsx`

---

## 🟢 **MEDIUM PRIORITY - UX & Polish**

### 7. Error Handling & User Feedback
**Problem**: Many console.error calls without proper user notifications
- [ ] Add toast notifications for all error states
- [ ] Implement retry logic for failed API calls
- [ ] Add offline detection and queue messages
- [ ] Show skeleton loaders instead of blank screens
- [ ] Add empty states with helpful CTAs
- [ ] Improve error messages to be user-friendly

**Files to modify**:
- All store files (`authStore.ts`, `chatStore.ts`, `exploreStore.ts`, `communityStore.ts`)
- All page components with error handling

---

### 8. Real-time Features
**Problem**: Real-time subscriptions set up but not fully utilized
- [ ] Add online/offline status updates in real-time
- [ ] Implement typing indicators in chat
- [ ] Add real-time post updates in Community feed
- [ ] Show notification badges for new messages
- [ ] Implement presence system for "last seen"
- [ ] Add real-time reaction updates on posts

**Files to modify**:
- `src/stores/chatStore.ts`
- `src/stores/communityStore.ts`
- `src/components/Navigation.tsx` (for notification badges)

---

### 9. Missing Profile Fields
**Problem**: Database has fields that aren't exposed in UI
- [ ] Add city field to profile form
- [ ] Add language goals section
- [ ] Add "looking for" preferences (language partner, cultural exchange, etc.)
- [ ] Add teaching experience toggle
- [ ] Add countries visited section
- [ ] Display all fields properly on ProfilePage

**Files to modify**:
- `src/pages/ProfilePage.tsx`
- `src/pages/SettingsPage.tsx`
- `src/integrations/supabase/fetchProfileById.ts`

---

### 10. Search & Filter Functionality
**Problem**: Filters partially implemented but not all work
- [ ] Fix language filters (currently show empty because data not loaded)
- [ ] Add fuzzy search for names and locations
- [ ] Add "Recently Online" filter
- [ ] Save filter preferences per user
- [ ] Add advanced filters (teaching experience, countries visited)
- [ ] Implement filter persistence across sessions

**Files to modify**:
- `src/pages/ExplorePage.tsx`
- `src/stores/exploreStore.ts`

---

## 🔵 **LOW PRIORITY - Nice to Have**

### 11. Translation Feature
**Problem**: Database supports translations but not implemented in UI
- [ ] Add translation toggle in chat messages
- [ ] Integrate translation API (Google Translate / DeepL)
- [ ] Show original + translation side by side
- [ ] Add language detection
- [ ] Store translations in database
- [ ] Add translation history

**Files to modify**:
- `src/pages/ChatPage.tsx`
- New file: `src/lib/translation.ts`

---

### 12. Cultural Events Feature
**Problem**: Types defined but no implementation
- [ ] Create cultural events calendar component
- [ ] Add event creation form
- [ ] Show events by country/culture
- [ ] Add event reminders
- [ ] Implement RSVP system
- [ ] Show upcoming events on dashboard

**Files to create**:
- `src/pages/EventsPage.tsx`
- `src/stores/eventsStore.ts`
- Database migration for events table

---

### 13. Notifications System
**Problem**: Notification types defined but no UI implementation
- [ ] Create notifications dropdown in Navigation
- [ ] Show unread count badge
- [ ] Implement notification preferences
- [ ] Add push notifications (PWA)
- [ ] Mark as read functionality
- [ ] Group notifications by type

**Files to modify**:
- `src/components/Navigation.tsx`
- New file: `src/stores/notificationStore.ts`

---

### 14. Voice Messages
**Problem**: Database supports voice messages but no UI
- [ ] Add voice recording button in chat
- [ ] Implement audio recording using Web Audio API
- [ ] Upload voice files to storage
- [ ] Add audio player component
- [ ] Show waveform visualization
- [ ] Add playback controls

**Files to modify**:
- `src/pages/ChatPage.tsx`
- New file: `src/components/VoiceRecorder.tsx`

---

### 15. PWA Features
**Problem**: InstallPWA component exists but incomplete
- [ ] Add proper PWA manifest configuration
- [ ] Implement service worker for offline support
- [ ] Add push notification support
- [ ] Cache static assets and API responses
- [ ] Add app update prompt
- [ ] Test on mobile devices

**Files to modify**:
- `src/components/InstallPWA.tsx`
- `public/manifest.json`
- New file: `public/sw.js`

---

## 📊 **Priority Summary**

### Week 1 Focus:
1. ✅ Profile Data Fetching (#1)
2. ✅ Community Posts Confusion (#2)
3. ✅ Onboarding Flow Completion (#4)

### Week 2 Focus:
4. ✅ Chat System Performance (#3)
5. ✅ Image Upload Implementation (#5)
6. ✅ Error Handling & User Feedback (#7)

### Week 3 Focus:
7. ✅ Language Exchange Matching (#6)
8. ✅ Missing Profile Fields (#9)
9. ✅ Search & Filter Functionality (#10)

### Week 4+ Focus:
10. Real-time Features (#8)
11. Translation Feature (#11)
12. All other nice-to-have features

---

## 🚨 **Breaking Issues (Fix Immediately)**

1. **Profile data incomplete** → Users can't see languages/interests → Matching doesn't work
2. **Community posts confusion** → Posts may not display correctly or save to wrong table
3. **Onboarding doesn't save** → New users stuck in incomplete state

---

## 📝 **Testing Checklist**

After fixing each item:
- [ ] Test with empty/null data
- [ ] Test with real Supabase instance
- [ ] Test error scenarios (network failure, auth expired)
- [ ] Test on mobile viewport
- [ ] Check browser console for errors
- [ ] Verify RLS policies allow operations
- [ ] Test real-time updates

---

**Last Updated**: 2025-10-07
**Status**: Initial assessment - ready to begin fixes
