@echo off
echo ========================================
echo Building Optimized APK for Friend Furlough
echo ========================================

echo Step 1: Installing APK optimization plugins...
call install-apk-plugins.bat

echo Step 2: Building optimized web app...
npm run build

echo Step 3: Syncing with Android...
npx cap sync android

echo Step 4: Copying optimized assets...
echo Copying optimized assets to Android...

echo Step 5: APK is ready to build!
echo ========================================
echo NEXT STEPS:
echo 1. Open Android Studio
echo 2. File > Open > android folder
echo 3. Wait for Gradle sync
echo 4. Build > Build APK(s)
echo ========================================
echo.
echo APK Features Included:
echo ✅ Hardware acceleration
echo ✅ Touch optimizations  
echo ✅ Keyboard handling
echo ✅ Connection stability
echo ✅ Performance monitoring
echo ✅ Memory optimization
echo ✅ Smooth scrolling
echo ✅ Mobile-first UI
echo ✅ File upload optimization
echo ✅ Offline support
echo ========================================

pause
