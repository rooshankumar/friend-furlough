# Production Optimization & APK Build Guide

## Current Status: ✅ Already Optimized

Your app is already well-optimized! Here's what's already in place:

### ✅ Existing Optimizations

1. **Lazy Loading** - All pages use React.lazy()
2. **Code Splitting** - Vite chunks vendors automatically
3. **Query Optimization** - React Query with 2min stale time
4. **Minification** - esbuild minifier enabled
5. **CSS Minification** - Enabled
6. **Tree Shaking** - Automatic with Vite
7. **ProGuard** - Enabled for release builds
8. **Resource Shrinking** - Enabled in build.gradle

## Additional Optimizations to Apply

### 1. Database Indexes (Critical for Performance)

Run this SQL in Supabase to add missing indexes:

```sql
-- Conversation participants indexes
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_conversation 
  ON conversation_participants(user_id, conversation_id);

-- Messages indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
  ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender 
  ON messages(sender_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
  ON notifications(user_id, read, created_at DESC);

-- Profile views indexes
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_viewed 
  ON profile_views(profile_id, viewed_at DESC);

-- Community posts indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_created 
  ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_user 
  ON community_posts(user_id);

-- Post reactions indexes
CREATE INDEX IF NOT EXISTS idx_post_reactions_post 
  ON post_reactions(post_id);

-- Friend requests indexes
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_status 
  ON friend_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_status 
  ON friend_requests(sender_id, status);
```

### 2. Optimize Vite Build Configuration

Already optimal, but here are the key settings:

```typescript
// vite.config.ts
build: {
  target: "esnext",
  minify: "esbuild",  // Fastest minifier
  cssMinify: true,
  chunkSizeWarningLimit: 1000,
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor': React, React-DOM
        'radix-vendor': Radix UI components
        'supabase-vendor': Supabase client
      }
    }
  }
}
```

### 3. Optimize Capacitor Configuration for Production

Update `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  appId: 'com.roshlingua.app',
  appName: 'roshLingua',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,  // CHANGE: Disable cleartext for production
  },
  android: {
    allowMixedContent: false,  // CHANGE: Disable for production
    captureInput: true,
    webContentsDebuggingEnabled: false,  // CHANGE: Disable for production
    backgroundColor: '#000000',
    loggingBehavior: 'production'  // CHANGE: Use production logging
  }
}
```

### 4. Optimize Android Build Configuration

Your `android/app/build.gradle` is already optimized:

```gradle
buildTypes {
    release {
        minifyEnabled true          // ✅ Enabled
        shrinkResources true        // ✅ Enabled
        proguardFiles ...          // ✅ Configured
        signingConfig signingConfigs.release  // ✅ Ready
    }
}
```

### 5. Image Optimization

Check image sizes in `public/` folder:

```bash
# Optimize images (run before build)
npm install -g sharp-cli
sharp -i public/**/*.{jpg,jpeg,png} -o public/ --quality 80 --progressive
```

## Production Build Steps

### Step 1: Apply Database Indexes

```bash
# Copy the SQL above and run in Supabase SQL Editor
```

### Step 2: Update Capacitor Config for Production

```typescript
// capacitor.config.ts
server: {
  cleartext: false,
},
android: {
  allowMixedContent: false,
  webContentsDebuggingEnabled: false,
  loggingBehavior: 'production'
}
```

### Step 3: Build Optimized Web App

```bash
# Clean previous builds
rm -rf dist/

# Build with production optimizations
npm run build

# Check build size
du -sh dist/
```

### Step 4: Sync to Android

```bash
# Sync web assets to Android
npx cap sync android

# Copy to Android
npx cap copy android
```

### Step 5: Generate Release Keystore (First Time Only)

```bash
cd android/app
keytool -genkey -v -keystore roshlingua-release.keystore -alias roshlingua -keyalg RSA -keysize 2048 -validity 10000

# Use these credentials (already in build.gradle):
# Store Password: roshlingua123
# Key Password: roshlingua123
# Alias: roshlingua
```

### Step 6: Build Signed APK

```bash
cd android

# Clean build
./gradlew clean

# Build release APK (signed automatically)
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/roshlingua.apk
```

### Step 7: Test Release APK

```bash
# Install on device
adb install android/app/build/outputs/apk/release/roshlingua.apk

# Check APK size
ls -lh android/app/build/outputs/apk/release/roshlingua.apk
```

## Performance Checklist

### Before Build
- [ ] Run database index SQL
- [ ] Update capacitor.config.ts for production
- [ ] Optimize images in public/ folder
- [ ] Remove console.logs from production code
- [ ] Test all features in development

### Build Process
- [ ] Clean previous builds
- [ ] Run `npm run build`
- [ ] Check build output size (should be < 5MB)
- [ ] Run `npx cap sync android`
- [ ] Build release APK

### After Build
- [ ] Test APK on physical device
- [ ] Check app startup time (< 3 seconds)
- [ ] Test offline functionality
- [ ] Test file uploads
- [ ] Test notifications
- [ ] Check memory usage
- [ ] Test on different Android versions

## Expected Build Sizes

- **Web Build (dist/)**: ~3-5 MB
- **Release APK**: ~15-25 MB
- **Installed Size**: ~30-50 MB

## Performance Targets

- **First Load**: < 3 seconds
- **Page Navigation**: < 500ms
- **Message Send**: < 1 second
- **Image Upload**: < 5 seconds (depending on size)
- **Offline Cache**: < 100 MB

## Troubleshooting

### Build Fails
```bash
# Clean everything
rm -rf dist/ node_modules/ android/app/build/
npm install
npm run build
npx cap sync android
cd android && ./gradlew clean assembleRelease
```

### APK Too Large
- Check if source maps are included (they shouldn't be)
- Optimize images
- Remove unused dependencies
- Check ProGuard is enabled

### App Crashes on Startup
- Check capacitor.config.ts settings
- Verify all permissions in AndroidManifest.xml
- Check ProGuard rules aren't removing needed code
- Test debug APK first

### Slow Performance
- Apply database indexes
- Check network requests (use React Query)
- Optimize images
- Enable ProGuard and resource shrinking

## Production Deployment

### Google Play Store Requirements
1. **Signed APK** - ✅ Already configured
2. **Version Code** - Increment in build.gradle
3. **Target SDK** - Currently 34 ✅
4. **Privacy Policy** - Required
5. **App Icon** - 512x512 PNG
6. **Screenshots** - 2-8 images
7. **Description** - App store listing

### Version Management

Update version in `android/app/build.gradle`:

```gradle
defaultConfig {
    versionCode 2          // Increment for each release
    versionName "1.1.0"    // Semantic versioning
}
```

## Quick Commands

```bash
# Full production build
npm run build && npx cap sync android && cd android && ./gradlew assembleRelease

# Install release APK
adb install android/app/build/outputs/apk/release/roshlingua.apk

# Check APK info
aapt dump badging android/app/build/outputs/apk/release/roshlingua.apk

# Check APK size
ls -lh android/app/build/outputs/apk/release/roshlingua.apk
```

## Status: Ready for Production ✅

Your app is optimized and ready to build a signed APK!
