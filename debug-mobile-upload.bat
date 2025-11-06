@echo off
echo ===================================================
echo Debug Mobile File Upload Issues
echo ===================================================

echo.
echo Step 1: Building web app in development mode...
call npm run build:dev

echo.
echo Step 2: Syncing Capacitor project...
call npx cap sync

echo.
echo Step 3: Building debug APK...
cd android
call gradlew assembleDebug
cd ..

echo.
echo Step 4: Installing APK on connected device...
call adb install -r android\app\build\outputs\apk\debug\app-debug.apk

echo.
echo ===================================================
echo Debug APK installed!
echo.
echo To view logs:
echo adb logcat *:E Capacitor:V CapacitorHttp:V CapacitorFilePicker:V
echo.
echo To debug WebView:
echo 1. Open Chrome
echo 2. Navigate to chrome://inspect
echo 3. Look for your app under "Remote Target"
echo ===================================================
echo.

pause
