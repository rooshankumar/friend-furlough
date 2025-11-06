@echo off
echo ═══════════════════════════════════════════════════════════════
echo   RoshLingua - Build and Deploy APK
echo ═══════════════════════════════════════════════════════════════
echo.

echo [1/5] Building web app...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed!
    exit /b %errorlevel%
)
echo ✅ Web app built successfully
echo.

echo [2/5] Syncing with Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ❌ Capacitor sync failed!
    exit /b %errorlevel%
)
echo ✅ Android synced successfully
echo.

echo [3/5] Cleaning Android build...
cd android
call gradlew clean
echo ✅ Android cleaned
echo.

echo [4/5] Building release APK...
call gradlew assembleRelease
if %errorlevel% neq 0 (
    echo ❌ APK build failed!
    cd ..
    exit /b %errorlevel%
)
echo ✅ APK built successfully
cd ..
echo.

echo [5/5] APK Location:
echo android\app\build\outputs\apk\release\roshLingua.apk
echo.

echo ═══════════════════════════════════════════════════════════════
echo   ✅ BUILD COMPLETE!
echo ═══════════════════════════════════════════════════════════════
echo.
echo To install on device:
echo   adb install android\app\build\outputs\apk\release\roshLingua.apk
echo.
echo Or to uninstall first:
echo   adb uninstall com.roshlingua.app
echo   adb install android\app\build\outputs\apk\release\roshLingua.apk
echo.
pause
