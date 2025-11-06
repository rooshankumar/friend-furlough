@echo off
echo ═══════════════════════════════════════════════════════════════
echo   RoshLingua - Build Debug APK (Faster)
echo ═══════════════════════════════════════════════════════════════
echo.

echo [1/4] Building web app...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed!
    exit /b %errorlevel%
)
echo ✅ Web app built successfully
echo.

echo [2/4] Syncing with Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ❌ Capacitor sync failed!
    exit /b %errorlevel%
)
echo ✅ Android synced successfully
echo.

echo [3/4] Building debug APK...
cd android
call gradlew assembleDebug
if %errorlevel% neq 0 (
    echo ❌ APK build failed!
    cd ..
    exit /b %errorlevel%
)
echo ✅ APK built successfully
cd ..
echo.

echo [4/4] APK Location:
echo android\app\build\outputs\apk\debug\app-debug.apk
echo.

echo ═══════════════════════════════════════════════════════════════
echo   ✅ DEBUG BUILD COMPLETE!
echo ═══════════════════════════════════════════════════════════════
echo.
echo To install on device:
echo   adb install android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause
