# 🚀 Quick Start: Build Production APK

## TL;DR - 3 Steps to Production APK

### 1️⃣ Apply Database Indexes (5 minutes)
```sql
-- Open Supabase SQL Editor
-- Copy and paste this file:
supabase/migrations/20251111_performance_indexes.sql

-- Then run these fixes:
supabase/migrations/20251111_fix_profile_view_trigger.sql
FIX_ORPHANED_DATA.sql
```

### 2️⃣ Build APK (5-10 minutes)
```bash
# Double-click this file:
build-production-apk.bat

# Or run manually:
npm run build
npx cap sync android
cd android && gradlew assembleRelease
```

### 3️⃣ Test APK
```bash
# Install on device
adb install android/app/build/outputs/apk/release/roshlingua.apk

# Test features:
✓ Login works
✓ Chat works
✓ Upload works
✓ No crashes
```

## That's It! 🎉

Your production APK is ready at:
`android/app/build/outputs/apk/release/roshlingua.apk`

---

## Detailed Steps (If Needed)

### Before Building

1. **Check Prerequisites**
   - [ ] Node.js installed
   - [ ] Android SDK installed
   - [ ] Java JDK 11+ installed
   - [ ] Keystore exists: `android/app/roshlingua-release.keystore`

2. **Apply Database Indexes**
   - Open Supabase Dashboard
   - Go to SQL Editor
   - Run `supabase/migrations/20251111_performance_indexes.sql`
   - Verify: Check pg_indexes table

3. **Update Version** (Optional)
   ```gradle
   // android/app/build.gradle
   versionCode 2  // Increment this
   versionName "1.1.0"
   ```

### Building

**Option 1: Automated (Recommended)**
```bash
build-production-apk.bat
```

**Option 2: Manual**
```bash
# Clean
rm -rf dist/ android/app/build/

# Build web
npm run build

# Sync Android
npx cap sync android

# Build APK
cd android
gradlew clean assembleRelease
```

### Testing

```bash
# Install
adb install android/app/build/outputs/apk/release/roshlingua.apk

# Check logs
adb logcat | grep RoshLingua

# Test features
- Login/Signup ✓
- Send message ✓
- Upload image ✓
- View profile ✓
- No crashes ✓
```

### Troubleshooting

**Build fails?**
```bash
# Clean everything
rm -rf dist/ node_modules/ android/app/build/
npm install
npm run build
npx cap sync android
cd android && gradlew clean assembleRelease
```

**APK won't install?**
- Uninstall old version first
- Enable "Install from unknown sources"
- Check device storage

**App crashes?**
```bash
# Check logs
adb logcat | grep -i error
```

## Performance Expectations

After applying indexes:
- **Startup**: < 3 seconds ✅
- **Load conversations**: < 500ms ✅
- **Send message**: < 1 second ✅
- **Upload image**: < 5 seconds ✅
- **APK size**: 15-25 MB ✅

## Files You Need

### Must Run (SQL)
1. `supabase/migrations/20251111_performance_indexes.sql` ⭐
2. `supabase/migrations/20251111_fix_profile_view_trigger.sql`
3. `FIX_ORPHANED_DATA.sql`

### Build Scripts
1. `build-production-apk.bat` - Automated build

### Documentation
1. `PRODUCTION_CHECKLIST.md` - Full checklist
2. `PRODUCTION_OPTIMIZATION.md` - Detailed guide
3. `OPTIMIZATION_COMPLETE.md` - Summary

## Quick Commands

```bash
# Build APK
build-production-apk.bat

# Install APK
adb install android/app/build/outputs/apk/release/roshlingua.apk

# Check APK size
ls -lh android/app/build/outputs/apk/release/roshlingua.apk

# View logs
adb logcat | grep RoshLingua
```

## Next Steps After APK

1. **Test thoroughly** - Use real device
2. **Prepare store listing** - Screenshots, description
3. **Create Play Store account** - $25 one-time fee
4. **Upload APK** - Google Play Console
5. **Submit for review** - Usually 1-3 days

## Support

Need help? Check these files:
- `PRODUCTION_CHECKLIST.md` - Troubleshooting
- `PRODUCTION_OPTIMIZATION.md` - Detailed guide
- Build logs in terminal

## Status: Ready! ✅

Your app is optimized and ready to build!

**Run:** `build-production-apk.bat`
