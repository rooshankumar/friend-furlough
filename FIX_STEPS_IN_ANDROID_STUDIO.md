# Fix Duplicate Resource Error - Android Studio Steps

## ✅ What I Did (Completed)

1. ✅ Deleted duplicate `ic_launcher_background.xml` from `values/` folder
2. ✅ Deleted Android build cache folders
3. ✅ Synced Capacitor

---

## 🔧 What YOU Need to Do in Android Studio

### Step 1: Invalidate Caches (IMPORTANT!)

1. In Android Studio, go to: **File** → **Invalidate Caches...**
2. Check **ALL** boxes:
   - ✅ Invalidate and Restart
   - ✅ Clear file system cache and Local History
   - ✅ Clear downloaded shared indexes
3. Click **Invalidate and Restart**
4. Wait for Android Studio to restart (this may take 1-2 minutes)

### Step 2: Wait for Gradle Sync

After Android Studio restarts:
- Wait for the Gradle sync to complete
- You'll see "Gradle sync finished" at the bottom
- Don't do anything until this completes!

### Step 3: Clean Project

1. Go to: **Build** → **Clean Project**
2. Wait for it to finish (check bottom status bar)

### Step 4: Rebuild Project

1. Go to: **Build** → **Rebuild Project**
2. Wait for it to finish
3. Check for any errors in the Build tab

### Step 5: Generate Signed APK

1. Go to: **Build** → **Generate Signed Bundle / APK**
2. Select: **APK**
3. Click **Next**
4. Keystore path: `android/app/roshlingua-release.keystore`
5. Password: `roshlingua123`
6. Key alias: (should auto-fill)
7. Key password: `roshlingua123`
8. Click **Next**
9. Select: **release**
10. Click **Finish**

---

## 🎯 Why This Fixes It

**The Problem:**
- Android Studio cached the old duplicate file
- Even though we deleted it, the cache still had it
- This caused the "Duplicate resources" error

**The Solution:**
- Invalidating caches clears all cached files
- Clean Project removes old build artifacts
- Rebuild Project creates fresh build files
- No more duplicates!

---

## ❌ If You Still Get the Error

If you STILL see "Duplicate resources" after following all steps:

### Nuclear Option - Complete Clean

1. **Close Android Studio completely**
2. **Delete these folders manually:**
   ```
   android/app/build
   android/build
   android/.gradle
   ```
3. **Delete Gradle cache:**
   ```
   C:\Users\priya\.gradle\caches
   ```
4. **Reopen Android Studio**
5. **Wait for Gradle sync**
6. **Try building again**

---

## 📋 Quick Checklist

- [ ] File → Invalidate Caches → Invalidate and Restart
- [ ] Wait for Android Studio to restart
- [ ] Wait for Gradle sync to complete
- [ ] Build → Clean Project
- [ ] Build → Rebuild Project
- [ ] Build → Generate Signed Bundle / APK
- [ ] APK builds successfully ✅

---

## 🎉 Success!

Once the APK builds without errors, you'll find it at:
```
android/app/release/app-release.apk
```

Your app will have:
- ✅ Custom roshLingua logo as app icon
- ✅ Custom roshLingua logo as splash screen
- ✅ No duplicate resource errors
- ✅ Ready to install and test!

---

## 💡 Pro Tip

Whenever you update Android resources (icons, colors, etc.):
1. Always run `npx cap sync android`
2. Always invalidate caches in Android Studio
3. Always clean and rebuild

This prevents cache-related errors!
