@echo off
echo ========================================
echo Mobile OAuth Setup Script
echo ========================================
echo.

echo Step 1: Installing Capacitor plugins...
call npm install @capacitor/browser @capacitor/app
if %errorlevel% neq 0 (
    echo ERROR: Failed to install plugins
    pause
    exit /b 1
)
echo ✓ Plugins installed successfully
echo.

echo Step 2: Building web app...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo ✓ Web app built successfully
echo.

echo Step 3: Syncing Android project...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Sync failed
    pause
    exit /b 1
)
echo ✓ Android project synced successfully
echo.

echo ========================================
echo Setup Complete! ✓
echo ========================================
echo.
echo Next steps:
echo 1. Configure Supabase redirect URL:
echo    com.roshlingua.app://oauth-callback
echo.
echo 2. Configure Google Cloud Console redirect URL:
echo    com.roshlingua.app://oauth-callback
echo.
echo 3. Build APK in Android Studio:
echo    npx cap open android
echo    Build ^> Build APK(s)
echo.
echo See MOBILE_OAUTH_SETUP.md for detailed instructions
echo.
pause
