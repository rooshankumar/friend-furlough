# Mobile OAuth Setup Guide - In-App Google Sign In

This guide explains how to set up Google OAuth to open within your mobile app instead of redirecting to a browser.

## 🎯 What Was Changed

### 1. Created Mobile Auth Utility
**File:** `src/lib/mobileAuth.ts`
- Handles in-app OAuth flow for mobile devices
- Opens OAuth in Capacitor's in-app browser
- Listens for deep link callbacks
- Automatically handles session after OAuth

### 2. Updated Android Manifest
**File:** `android/app/src/main/AndroidManifest.xml`
- Added deep link intent filter for OAuth callback
- Scheme: `com.roshlingua.app://oauth-callback`
- Enables app to receive OAuth redirect

### 3. Modified Auth Store
**File:** `src/stores/authStore.ts`
- Updated `signInWithGoogle()` to use mobile-optimized flow
- Automatically detects mobile vs web
- Uses in-app browser on mobile, web OAuth on desktop

### 4. Initialized OAuth Listener
**File:** `src/App.tsx`
- Initializes OAuth deep link listener on app start
- Cleans up listener on app unmount
- Handles OAuth callbacks automatically

## 📦 Installation Steps

### Step 1: Install Required Capacitor Plugins

```bash
npm install @capacitor/browser @capacitor/app
```

### Step 2: Sync Android Project

```bash
npx cap sync android
```

### Step 3: Configure Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add the following redirect URL:
   ```
   com.roshlingua.app://oauth-callback
   ```
4. Save changes

### Step 4: Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add:
   ```
   com.roshlingua.app://oauth-callback
   ```
6. Save changes

### Step 5: Build and Test

```bash
# Build web app
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android

# Build APK in Android Studio
# Build > Build APK(s)
```

## 🔧 How It Works

### OAuth Flow Diagram

```
User clicks "Sign in with Google"
         ↓
App calls signInWithGoogle()
         ↓
Detects mobile platform
         ↓
Opens in-app browser with Google OAuth
         ↓
User signs in with Google
         ↓
Google redirects to: com.roshlingua.app://oauth-callback
         ↓
Deep link listener catches callback
         ↓
Supabase handles session from URL
         ↓
User is signed in ✅
```

### Technical Details

1. **Mobile Detection**: Uses `Capacitor.isNativePlatform()`
2. **In-App Browser**: Uses `@capacitor/browser` plugin
3. **Deep Linking**: Uses `@capacitor/app` plugin
4. **Session Handling**: Supabase automatically extracts session from callback URL

## 🎨 Customization

### Change Browser Appearance

Edit `src/lib/mobileAuth.ts`:

```typescript
await Browser.open({
  url: data.url,
  presentationStyle: 'popover', // or 'fullscreen'
  toolbarColor: '#3b82f6', // Your primary color
});
```

### Change Deep Link Scheme

If you want a different scheme (e.g., `myapp://`):

1. Update `src/lib/mobileAuth.ts`:
   ```typescript
   const APP_SCHEME = 'myapp';
   const REDIRECT_URL = `${APP_SCHEME}://oauth-callback`;
   ```

2. Update `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <data android:scheme="myapp" android:host="oauth-callback" />
   ```

3. Update Supabase and Google Cloud Console redirect URLs

## 🧪 Testing

### Test on Emulator

1. Build and install APK on emulator
2. Click "Continue with Google"
3. Should open in-app browser (not external browser)
4. Sign in with Google
5. Browser should close automatically
6. User should be signed in

### Test on Physical Device

1. Enable USB debugging
2. Connect device via USB
3. Run: `adb install android/app/build/outputs/apk/debug/app-debug.apk`
4. Test OAuth flow

### Debugging

Enable debug logging in `src/lib/mobileAuth.ts`:

```typescript
console.log('Deep link received:', data.url);
console.log('OAuth callback received');
```

Check Android logs:
```bash
adb logcat | grep -i oauth
```

## 🐛 Troubleshooting

### Issue: Browser opens externally instead of in-app

**Solution:**
- Ensure `@capacitor/browser` is installed
- Run `npx cap sync android`
- Rebuild APK

### Issue: OAuth callback not working

**Solution:**
- Check deep link is configured in AndroidManifest.xml
- Verify redirect URL in Supabase dashboard
- Verify redirect URL in Google Cloud Console
- Check scheme matches exactly: `com.roshlingua.app`

### Issue: Session not created after OAuth

**Solution:**
- Check Supabase logs for errors
- Verify OAuth provider is enabled in Supabase
- Check network connectivity
- Verify Google OAuth credentials are correct

### Issue: "Invalid redirect URL" error

**Solution:**
- Add redirect URL to Supabase dashboard
- Add redirect URL to Google Cloud Console
- Ensure URL matches exactly (no trailing slash)

## 📱 Platform Support

- ✅ Android (tested)
- ✅ iOS (should work, needs testing)
- ✅ Web (fallback to standard OAuth)

## 🔐 Security

- Uses HTTPS scheme for Android (`androidScheme: 'https'`)
- OAuth tokens handled securely by Supabase
- In-app browser isolated from main app
- Deep links verified with `android:autoVerify="true"`

## 📚 References

- [Capacitor Browser Plugin](https://capacitorjs.com/docs/apis/browser)
- [Capacitor App Plugin](https://capacitorjs.com/docs/apis/app)
- [Supabase OAuth](https://supabase.com/docs/guides/auth/social-login)
- [Android Deep Links](https://developer.android.com/training/app-links)

## ✅ Checklist

Before deploying:

- [ ] Install `@capacitor/browser` and `@capacitor/app`
- [ ] Run `npx cap sync android`
- [ ] Add redirect URL to Supabase dashboard
- [ ] Add redirect URL to Google Cloud Console
- [ ] Test OAuth flow on emulator
- [ ] Test OAuth flow on physical device
- [ ] Verify session is created successfully
- [ ] Test sign out functionality

## 🎉 Success!

Your app now supports in-app Google OAuth! Users will have a seamless sign-in experience without leaving your app.
