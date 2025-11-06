@echo off
echo ========================================
echo Quick Fix: Duplicate Resource Error
echo ========================================
echo.

echo [1/3] Deleting Android build cache...
rmdir /s /q "android\app\build" 2>nul
rmdir /s /q "android\build" 2>nul
rmdir /s /q "android\.gradle" 2>nul
echo Done!

echo.
echo [2/3] Cleaning Gradle...
cd android
call gradlew clean
cd ..
echo Done!

echo.
echo [3/3] Syncing Capacitor...
call npx cap sync android
echo Done!

echo.
echo ========================================
echo Fixed! Now do this in Android Studio:
echo ========================================
echo.
echo 1. File ^> Invalidate Caches ^> Invalidate and Restart
echo 2. Wait for Android Studio to restart
echo 3. Wait for Gradle sync to complete
echo 4. Build ^> Clean Project
echo 5. Build ^> Rebuild Project
echo 6. Build ^> Generate Signed Bundle / APK
echo.
echo The duplicate resource error should be gone!
echo.
pause
