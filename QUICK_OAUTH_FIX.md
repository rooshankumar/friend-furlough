# Quick OAuth Fix - Google Console Configuration

## ❌ WRONG URL (Google rejects this)
```
com.roshlingua.app://oauth-callback
```
**Error:** "Invalid Redirect: must end with a public top-level domain (such as .com or .org)"

---

## ✅ CORRECT URL (Use this instead)
```
https://bblrxervgwkphkctdghe.supabase.co/auth/v1/callback
```

---

## 🔧 What to Do Now

### 1. Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Navigate to: **APIs & Services** → **Credentials**
3. Click your OAuth Client ID
4. Under **Authorized redirect URIs**, **REMOVE** the old URL:
   ```
   ❌ com.roshlingua.app://oauth-callback
   ```
5. **ADD** the new URL:
   ```
   ✅ https://bblrxervgwkphkctdghe.supabase.co/auth/v1/callback
   ```
6. Click **Save**
7. **Wait 5-10 minutes** for changes to take effect

### 2. Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Navigate to: **Authentication** → **URL Configuration**
3. Verify this URL exists (it should already be there):
   ```
   https://bblrxervgwkphkctdghe.supabase.co/auth/v1/callback
   ```
4. If not, add it and save

### 3. Rebuild APK

```bash
# Already done! Just build APK in Android Studio
npx cap open android
# Then: Build > Build APK(s)
```

---

## 🎯 Why This Works

- **Google OAuth** requires a valid HTTPS URL with a public domain
- **Supabase** provides this URL by default
- **Android App Links** intercepts the HTTPS URL and opens your app
- **In-app browser** still works - user never leaves your app!

---

## ✅ Expected Result

After configuration:

1. User clicks "Sign in with Google"
2. **In-app browser opens** (not external browser)
3. User signs in with Google
4. Browser closes automatically
5. User is signed in to your app

---

## 📱 Test It

1. Install new APK on device
2. Click "Continue with Google"
3. Should open in-app browser
4. Sign in with Google
5. Browser should close automatically
6. You should be signed in!

---

## 🐛 If It Doesn't Work

1. **Wait 10 minutes** - Google changes take time
2. **Clear app data** - Settings > Apps > roshLingua > Clear Data
3. **Reinstall APK**
4. **Check logs**: `adb logcat | grep -i oauth`

---

## 📋 Summary

**Old (Wrong):** `com.roshlingua.app://oauth-callback` ❌  
**New (Correct):** `https://bblrxervgwkphkctdghe.supabase.co/auth/v1/callback` ✅

**Action Required:**
1. Update Google Cloud Console ✅
2. Wait 5-10 minutes ⏳
3. Build APK in Android Studio 🔨
4. Test OAuth flow 🧪

That's it! 🎉
