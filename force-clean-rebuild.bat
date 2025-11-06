@echo off
echo ===================================================================
echo   FORCE CLEAN REBUILD - CLEAR ALL CACHES
echo ===================================================================
echo.

echo Step 1: Cleaning dist folder...
if exist "dist" (
    rmdir /s /q "dist"
    echo   [OK] dist folder deleted
) else (
    echo   [SKIP] dist folder doesn't exist
)

echo.
echo Step 2: Cleaning node_modules/.vite cache...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo   [OK] Vite cache deleted
) else (
    echo   [SKIP] Vite cache doesn't exist
)

echo.
echo Step 3: Cleaning Android build folders...
if exist "android\app\build" (
    rmdir /s /q "android\app\build"
    echo   [OK] Android build folder deleted
)
if exist "android\build" (
    rmdir /s /q "android\build"
    echo   [OK] Android root build folder deleted
)
if exist "android\.gradle" (
    rmdir /s /q "android\.gradle"
    echo   [OK] Gradle cache deleted
)

echo.
echo Step 4: Cleaning Android web assets...
if exist "android\app\src\main\assets\public" (
    rmdir /s /q "android\app\src\main\assets\public"
    echo   [OK] Old web assets deleted
)

echo.
echo Step 5: Building fresh web app...
call npm run build
if %errorlevel% neq 0 (
    echo   [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo Step 6: Syncing to Capacitor...
call npx cap sync android
if %errorlevel% neq 0 (
    echo   [ERROR] Capacitor sync failed!
    pause
    exit /b 1
)

echo.
echo ===================================================================
echo   SUCCESS! Fresh build ready
echo ===================================================================
echo.
echo NEXT STEPS:
echo   1. Open Android Studio
echo   2. File ^> Invalidate Caches ^> Invalidate and Restart
echo   3. Build ^> Clean Project
echo   4. Build ^> Rebuild Project
echo   5. Build ^> Generate Signed Bundle / APK
echo.
echo OR run Gradle directly:
echo   cd android
echo   gradlew clean
echo   gradlew assembleRelease
echo.
pause
