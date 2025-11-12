@echo off
echo ========================================
echo Building Signed APK for roshLingua
echo ========================================

echo.
echo Step 1: Building web app...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Web build failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Syncing with Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ❌ Capacitor sync failed!
    pause
    exit /b 1
)

echo.
echo Step 3: Opening Android Studio...
echo Please follow these steps in Android Studio:
echo 1. Build > Generate Signed Bundle/APK
echo 2. Choose APK
echo 3. Select your keystore file
echo 4. Enter keystore password
echo 5. Select release build variant
echo 6. Build APK
echo.

call npx cap open android

echo.
echo ========================================
echo APK Build Process Started
echo ========================================
echo.
echo Next steps:
echo 1. Android Studio should be opening
echo 2. Follow the signed APK generation steps above
echo 3. APK will be generated in android/app/release/
echo.
echo App Details:
echo - App Name: roshLingua
echo - Package: com.roshlingua.app
echo - Version: Check package.json
echo.
pause
