# OAuth Debug Guide - Mobile App

## 🔍 What I Fixed

The OAuth callback was **receiving the URL but not processing the session tokens**.

### The Problem
```typescript
// OLD CODE - Just closed browser, didn't extract tokens
if (data.url.includes('supabase.co/auth/v1/callback')) {
  console.log('OAuth callback received');
  await Browser.close();
}
```

### The Solution
```typescript
// NEW CODE - Extracts tokens and sets session
if (data.url.includes('supabase.co/auth/v1/callback')) {
  // Extract access_token and refresh_token from URL
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  
  // Set the session in Supabase
  await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
}
```

---

## 🚀 Testing Steps

### 1. Rebuild the App

```bash
# Build web assets
npm run build

# Sync to Android
npx cap sync android

# Open Android Studio
npx cap open android

# Build APK
```

### 2. Install Fresh APK

```bash
# Uninstall old version first
adb uninstall com.roshlingua.app

# Install new version
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### 3. Test OAuth Flow

1. Open the app
2. Click "Sign in with Google"
3. In-app browser should open
4. Sign in with Google
5. Browser should close
6. **You should now be logged in!**

---

## 🐛 Debug with Logcat

To see what's happening, use Android Logcat:

### In Android Studio:

1. **View** → **Tool Windows** → **Logcat**
2. Filter by: `chromium` or `Capacitor`
3. Click "Sign in with Google"
4. Watch for these logs:

```
✅ Good logs:
- "Deep link received: https://bblrxervgwkphkctdghe.supabase.co/auth/v1/callback#..."
- "OAuth callback detected, processing session..."
- "Tokens found, setting session..."
- "Session set successfully!"

❌ Bad logs:
- "No tokens found in callback URL"
- "Error setting session: ..."
- "Error processing OAuth callback: ..."
```

### Using ADB:

```bash
# Clear logs
adb logcat -c

# Watch logs in real-time
adb logcat | grep -i "capacitor\|oauth\|supabase"

# Or save to file
adb logcat > oauth-debug.log
```

---

## 🔧 Common Issues & Fixes

### Issue 1: "No tokens found in callback URL"

**Cause:** The callback URL doesn't have the tokens in the expected format.

**Fix:**
1. Check Google Cloud Console redirect URL is correct:
   ```
   https://bblrxervgwkphkctdghe.supabase.co/auth/v1/callback
   ```
2. Check Supabase Dashboard → Authentication → URL Configuration
3. Wait 5-10 minutes after changing Google Console settings

### Issue 2: Browser doesn't close after sign-in

**Cause:** Deep link not being intercepted by the app.

**Fix:**
1. Verify `AndroidManifest.xml` has the intent filter
2. Check `android:autoVerify="true"` is set
3. Ensure app is set as default handler for the URL

### Issue 3: App opens but not logged in

**Cause:** Session not being set properly.

**Fix:**
1. Check Logcat for "Session set successfully"
2. Verify tokens are present in the callback URL
3. Check Supabase project settings

### Issue 4: "Error setting session"

**Cause:** Invalid tokens or Supabase configuration issue.

**Fix:**
1. Check Supabase project URL matches in code
2. Verify Supabase anon key is correct
3. Check Google OAuth client is configured in Supabase

---

## 📋 Verification Checklist

### Google Cloud Console
- [ ] OAuth Client ID created
- [ ] Redirect URI: `https://bblrxervgwkphkctdghe.supabase.co/auth/v1/callback`
- [ ] Waited 5-10 minutes after saving

### Supabase Dashboard
- [ ] Google provider enabled
- [ ] Google Client ID configured
- [ ] Google Client Secret configured
- [ ] Site URL set correctly

### Android App
- [ ] `AndroidManifest.xml` has intent filter
- [ ] Intent filter has `android:autoVerify="true"`
- [ ] App rebuilt after code changes
- [ ] Fresh APK installed

### Code
- [ ] `mobileAuth.ts` updated with token extraction
- [ ] `initOAuthListener()` called in `App.tsx`
- [ ] Supabase client configured correctly

---

## 🎯 Expected Flow

1. **User clicks "Sign in with Google"**
   - `signInWithGoogleMobile()` called
   - Supabase generates OAuth URL
   - In-app browser opens

2. **User signs in with Google**
   - Google authenticates user
   - Google redirects to: `https://bblrxervgwkphkctdghe.supabase.co/auth/v1/callback#access_token=...`

3. **Android App Links intercepts URL**
   - `AndroidManifest.xml` intent filter catches the URL
   - App comes to foreground
   - `appUrlOpen` event fires

4. **Deep link listener processes callback**
   - Extracts `access_token` and `refresh_token`
   - Calls `supabase.auth.setSession()`
   - Closes in-app browser

5. **User is logged in!**
   - Auth state changes
   - `authStore` updates
   - UI shows logged-in state

---

## 🔍 Manual Testing

### Test 1: Deep Link Handler

Test if the app can handle deep links:

```bash
# Send a test deep link
adb shell am start -a android.intent.action.VIEW -d "https://bblrxervgwkphkctdghe.supabase.co/auth/v1/callback#test=true"
```

**Expected:** App should open and log "Deep link received"

### Test 2: OAuth URL

Check what URL Supabase generates:

```typescript
// Add this temporarily in signInWithGoogleMobile
console.log('OAuth URL:', data.url);
```

**Expected:** URL should be a Google OAuth URL

### Test 3: Callback URL

Check what URL comes back:

```typescript
// In appUrlOpen listener
console.log('Full callback URL:', data.url);
console.log('Hash:', new URL(data.url).hash);
console.log('Search:', new URL(data.url).search);
```

**Expected:** Should see `access_token` and `refresh_token`

---

## 💡 Pro Tips

### Tip 1: Clear App Data

Between tests, clear app data:
```bash
adb shell pm clear com.roshlingua.app
```

### Tip 2: Check Network

OAuth requires internet. Verify:
```bash
adb shell ping -c 3 google.com
```

### Tip 3: Test on Real Device

Emulators can have OAuth issues. Test on real device if possible.

### Tip 4: Check Supabase Logs

Supabase Dashboard → Logs → Auth logs
- See if OAuth requests are reaching Supabase
- Check for any errors

---

## 🎉 Success Indicators

When it works, you'll see:

1. ✅ In-app browser opens with Google sign-in
2. ✅ After signing in, browser closes automatically
3. ✅ App shows logged-in state immediately
4. ✅ User profile/name appears in UI
5. ✅ Logcat shows "Session set successfully!"

---

## 📞 Still Not Working?

If OAuth still doesn't work after all this:

1. **Share Logcat output** - Capture the full OAuth flow
2. **Check callback URL** - What URL is actually received?
3. **Verify Google Console** - Screenshot of redirect URIs
4. **Check Supabase settings** - Screenshot of Google provider config
5. **Test on different device** - Rule out device-specific issues

---

## 🔄 Quick Fix Script

I've updated the code. To apply:

```bash
# 1. Build
npm run build

# 2. Sync
npx cap sync android

# 3. Rebuild APK in Android Studio

# 4. Uninstall old app
adb uninstall com.roshlingua.app

# 5. Install new app
adb install path/to/new.apk

# 6. Test OAuth
```

The key fix: **Actually extracting and setting the session tokens from the callback URL!**
