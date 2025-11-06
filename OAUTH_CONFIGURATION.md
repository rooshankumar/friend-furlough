# OAuth Configuration Guide - CORRECT URLs

## ✅ The Problem & Solution

**Problem:** Google OAuth doesn't accept custom URL schemes like `com.roshlingua.app://oauth-callback`

**Solution:** Use your Supabase HTTPS URL instead: `https://bblrxervgwkphkctdghe.supabase.co/auth/v1/callback`

---

## 🔧 Configuration Steps

### 1. Supabase Dashboard Configuration

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Under **Redirect URLs**, add:
   ```
   https://bblrxervgwkphkctdghe.supabase.co/auth/v1/callback
   ```
4. Click **Save**

**Note:** This URL is already the default for Supabase, so it should already be there. Just verify it exists.

---

### 2. Google Cloud Console Configuration

1. Go to: https://console.cloud.google.com/
2. Select your project: **roshLingua**
3. Navigate to: **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID: `566050034640-veqvr4osff6uushin3nu5gjovgst9gai.apps.googleusercontent.com`
5. Under **Authorized redirect URIs**, add:
   ```
   https://bblrxervgwkphkctdghe.supabase.co/auth/v1/callback
   ```
6. Click **Save**

**Important:** Google may take 5 minutes to a few hours for the changes to take effect.

---

## 📱 How It Works on Mobile

### OAuth Flow

```
User clicks "Sign in with Google"
         ↓
App opens in-app browser
         ↓
Google OAuth page loads
         ↓
User signs in with Google
         ↓
Google redirects to: https://bblrxervgwkphkctdghe.supabase.co/auth/v1/callback
         ↓
Android App Links intercepts the URL
         ↓
App receives the callback (appUrlOpen event)
         ↓
Browser closes automatically
         ↓
Supabase handles session
         ↓
User is signed in ✅
```

### Technical Details

1. **In-App Browser**: Uses `@capacitor/browser` to open OAuth in-app
2. **Android App Links**: Configured in `AndroidManifest.xml` to intercept Supabase URLs
3. **Deep Link Listener**: Listens for `appUrlOpen` events in `App.tsx`
4. **Session Handling**: Supabase automatically extracts session from callback URL

---

## 🧪 Testing

### Test on Emulator/Device

1. Build and install APK:
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   # Build > Build APK(s)
   ```

2. Install APK on device/emulator

3. Open app and click "Continue with Google"

4. **Expected behavior:**
   - ✅ In-app browser opens (not external browser)
   - ✅ Google sign-in page loads
   - ✅ After sign-in, browser closes automatically
   - ✅ User is signed in to the app

5. **If external browser opens instead:**
   - Verify Android manifest has the correct intent filter
   - Rebuild APK after changes
   - Clear app data and try again

---

## 🐛 Troubleshooting

### Issue: "Invalid Redirect" error in Google Console

**Cause:** Using custom scheme like `com.roshlingua.app://oauth-callback`

**Solution:** Use HTTPS URL instead:
```
https://bblrxervgwkphkctdghe.supabase.co/auth/v1/callback
```

### Issue: Browser opens externally instead of in-app

**Solution:**
1. Verify `@capacitor/browser` is installed
2. Run `npx cap sync android`
3. Rebuild APK
4. Clear app data and reinstall

### Issue: OAuth callback not working

**Solution:**
1. Check Android manifest has correct intent filter
2. Verify URL in Google Console matches exactly
3. Wait 5-10 minutes for Google changes to propagate
4. Check Android logs: `adb logcat | grep -i oauth`

### Issue: "Redirect URI mismatch" error

**Solution:**
1. Ensure URL in Google Console is exactly:
   ```
   https://bblrxervgwkphkctdghe.supabase.co/auth/v1/callback
   ```
2. No trailing slash
3. Must use `https://` not `http://`
4. Wait for Google changes to take effect

---

## 📋 Checklist

Before testing:

- [ ] Added redirect URL to Supabase dashboard
- [ ] Added redirect URL to Google Cloud Console
- [ ] Waited 5-10 minutes for Google changes
- [ ] Ran `npm run build`
- [ ] Ran `npx cap sync android`
- [ ] Built new APK in Android Studio
- [ ] Installed APK on device/emulator
- [ ] Tested OAuth flow

---

## 🔐 Security

- ✅ Uses HTTPS (secure)
- ✅ Android App Links verified with `android:autoVerify="true"`
- ✅ OAuth tokens handled by Supabase (never exposed to app)
- ✅ In-app browser isolated from main app
- ✅ Session stored securely in localStorage

---

## 📚 Files Modified

1. **src/lib/mobileAuth.ts**
   - Changed redirect URL to Supabase HTTPS URL
   - Updated listener to handle Supabase callback

2. **android/app/src/main/AndroidManifest.xml**
   - Updated intent filter to handle HTTPS URLs
   - Configured Android App Links

---

## ✅ Summary

**Correct Redirect URL:**
```
https://bblrxervgwkphkctdghe.supabase.co/auth/v1/callback
```

**Where to add it:**
1. ✅ Supabase Dashboard (should already be there)
2. ✅ Google Cloud Console (add it now)

**After configuration:**
- Wait 5-10 minutes
- Rebuild APK
- Test OAuth flow

Your app will now open Google OAuth in an in-app browser and handle the callback seamlessly! 🎉
