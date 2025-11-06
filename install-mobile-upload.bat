@echo off
echo ===================================================
echo Installing Mobile File Upload Dependencies
echo ===================================================

echo.
echo Step 1: Installing Capacitor plugins...
call npm install @capawesome/capacitor-file-picker @capacitor/filesystem @gachlab/capacitor-permissions --save

echo.
echo Step 2: Syncing Capacitor project...
call npx cap sync

echo.
echo Step 3: Building web app...
call npm run build

echo.
echo Step 4: Syncing Capacitor project again...
call npx cap sync

echo.
echo ===================================================
echo Installation complete!
echo.
echo Next steps:
echo 1. Open Android Studio: npx cap open android
echo 2. Build and run the app on your device
echo ===================================================
echo.

pause
