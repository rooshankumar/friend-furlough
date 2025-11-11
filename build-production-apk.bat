@echo off
REM ==========================================
REM PRODUCTION APK BUILD SCRIPT
REM ==========================================
REM This script builds an optimized, signed release APK

echo.
echo ========================================
echo RoshLingua Production APK Builder
echo ========================================
echo.

REM Step 1: Clean previous builds
echo [1/7] Cleaning previous builds...
if exist dist rmdir /s /q dist
if exist android\app\build rmdir /s /q android\app\build
echo ✓ Clean complete
echo.

REM Step 2: Install dependencies (if needed)
echo [2/7] Checking dependencies...
if not exist node_modules (
    echo Installing dependencies...
    call npm install
) else (
    echo ✓ Dependencies already installed
)
echo.

REM Step 3: Build optimized web app
echo [3/7] Building optimized web app...
call npm run build
if errorlevel 1 (
    echo ✗ Build failed!
    pause
    exit /b 1
)
echo ✓ Web build complete
echo.

REM Step 4: Check build size
echo [4/7] Checking build size...
for /f %%A in ('powershell -command "(Get-ChildItem -Path dist -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB"') do set BUILD_SIZE=%%A
echo Build size: %BUILD_SIZE% MB
echo.

REM Step 5: Sync to Android
echo [5/7] Syncing to Android...
call npx cap sync android
if errorlevel 1 (
    echo ✗ Sync failed!
    pause
    exit /b 1
)
echo ✓ Sync complete
echo.

REM Step 6: Build release APK
echo [6/7] Building signed release APK...
echo This may take 2-5 minutes...
cd android
call gradlew clean assembleRelease
if errorlevel 1 (
    echo ✗ APK build failed!
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✓ APK build complete
echo.

REM Step 7: Show results
echo [7/7] Build Summary
echo ========================================
if exist android\app\build\outputs\apk\release\roshlingua.apk (
    echo ✓ SUCCESS: Release APK created!
    echo.
    echo Location: android\app\build\outputs\apk\release\roshlingua.apk
    echo.
    for %%A in (android\app\build\outputs\apk\release\roshlingua.apk) do (
        set APK_SIZE=%%~zA
    )
    powershell -command "$size = %APK_SIZE% / 1MB; Write-Host ('APK Size: ' + $size.ToString('0.00') + ' MB')"
    echo.
    echo Next steps:
    echo 1. Test APK: adb install android\app\build\outputs\apk\release\roshlingua.apk
    echo 2. Upload to Google Play Store
    echo.
) else (
    echo ✗ FAILED: APK not found!
    echo Check the error messages above.
)
echo ========================================
echo.

pause
