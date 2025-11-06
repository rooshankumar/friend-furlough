@echo off
echo ========================================
echo roshLingua Android Icon Generator
echo ========================================
echo.

echo Copying your logo to all Android icon locations...
echo.

set SOURCE=public\roshlingua-logo-512.png
set RES=android\app\src\main\res

REM Create directories if they don't exist
mkdir "%RES%\mipmap-mdpi" 2>nul
mkdir "%RES%\mipmap-hdpi" 2>nul
mkdir "%RES%\mipmap-xhdpi" 2>nul
mkdir "%RES%\mipmap-xxhdpi" 2>nul
mkdir "%RES%\mipmap-xxxhdpi" 2>nul
mkdir "%RES%\mipmap-anydpi-v26" 2>nul
mkdir "%RES%\values" 2>nul

echo Copying to mipmap-mdpi...
copy /Y "%SOURCE%" "%RES%\mipmap-mdpi\ic_launcher.png" >nul
copy /Y "%SOURCE%" "%RES%\mipmap-mdpi\ic_launcher_round.png" >nul
copy /Y "%SOURCE%" "%RES%\mipmap-mdpi\ic_launcher_foreground.png" >nul

echo Copying to mipmap-hdpi...
copy /Y "%SOURCE%" "%RES%\mipmap-hdpi\ic_launcher.png" >nul
copy /Y "%SOURCE%" "%RES%\mipmap-hdpi\ic_launcher_round.png" >nul
copy /Y "%SOURCE%" "%RES%\mipmap-hdpi\ic_launcher_foreground.png" >nul

echo Copying to mipmap-xhdpi...
copy /Y "%SOURCE%" "%RES%\mipmap-xhdpi\ic_launcher.png" >nul
copy /Y "%SOURCE%" "%RES%\mipmap-xhdpi\ic_launcher_round.png" >nul
copy /Y "%SOURCE%" "%RES%\mipmap-xhdpi\ic_launcher_foreground.png" >nul

echo Copying to mipmap-xxhdpi...
copy /Y "%SOURCE%" "%RES%\mipmap-xxhdpi\ic_launcher.png" >nul
copy /Y "%SOURCE%" "%RES%\mipmap-xxhdpi\ic_launcher_round.png" >nul
copy /Y "%SOURCE%" "%RES%\mipmap-xxhdpi\ic_launcher_foreground.png" >nul

echo Copying to mipmap-xxxhdpi...
copy /Y "%SOURCE%" "%RES%\mipmap-xxxhdpi\ic_launcher.png" >nul
copy /Y "%SOURCE%" "%RES%\mipmap-xxxhdpi\ic_launcher_round.png" >nul
copy /Y "%SOURCE%" "%RES%\mipmap-xxxhdpi\ic_launcher_foreground.png" >nul

echo.
echo Creating adaptive icon XML files...

REM Create ic_launcher.xml
(
echo ^<?xml version="1.0" encoding="utf-8"?^>
echo ^<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"^>
echo     ^<background android:drawable="@color/ic_launcher_background"/^>
echo     ^<foreground android:drawable="@mipmap/ic_launcher_foreground"/^>
echo ^</adaptive-icon^>
) > "%RES%\mipmap-anydpi-v26\ic_launcher.xml"

REM Create ic_launcher_round.xml
(
echo ^<?xml version="1.0" encoding="utf-8"?^>
echo ^<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"^>
echo     ^<background android:drawable="@color/ic_launcher_background"/^>
echo     ^<foreground android:drawable="@mipmap/ic_launcher_foreground"/^>
echo ^</adaptive-icon^>
) > "%RES%\mipmap-anydpi-v26\ic_launcher_round.xml"

REM Create colors.xml
(
echo ^<?xml version="1.0" encoding="utf-8"?^>
echo ^<resources^>
echo     ^<color name="ic_launcher_background"^>#3b82f6^</color^>
echo ^</resources^>
) > "%RES%\values\colors.xml"

echo.
echo ========================================
echo SUCCESS! All icons updated!
echo ========================================
echo.
echo Your roshLingua logo is now set as the app icon.
echo.
echo Next steps:
echo 1. Run: npx cap sync android
echo 2. Build APK in Android Studio
echo 3. Your custom logo will appear!
echo.
pause
