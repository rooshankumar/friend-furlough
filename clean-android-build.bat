@echo off
echo ========================================
echo Android Build Cache Cleaner
echo ========================================
echo.

echo Cleaning Android build cache...
echo.

cd android

echo [1/5] Cleaning Gradle cache...
call gradlew clean
echo Done!

echo.
echo [2/5] Deleting build folders...
rmdir /s /q app\build 2>nul
rmdir /s /q build 2>nul
rmdir /s /q .gradle 2>nul
echo Done!

echo.
echo [3/5] Deleting generated files...
del /q app\.cxx 2>nul
rmdir /s /q app\.cxx 2>nul
echo Done!

echo.
echo [4/5] Invalidating caches...
rmdir /s /q %USERPROFILE%\.gradle\caches 2>nul
echo Done!

echo.
echo [5/5] Syncing Capacitor...
cd ..
call npx cap sync android
echo Done!

echo.
echo ========================================
echo Clean Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Close Android Studio completely
echo 2. Reopen Android Studio
echo 3. File ^> Invalidate Caches ^> Invalidate and Restart
echo 4. Wait for Gradle sync
echo 5. Build ^> Clean Project
echo 6. Build ^> Rebuild Project
echo 7. Build APK
echo.
pause
