@echo off
echo ========================================
echo roshLingua Complete Branding Update
echo ========================================
echo.
echo This will update:
echo - App icons (all densities)
echo - Splash screens (all orientations)
echo - Adaptive icons
echo - Brand colors
echo.
pause

set SOURCE=public\roshlingua-logo-512.png
set RES=android\app\src\main\res

echo.
echo [1/4] Creating directories...
mkdir "%RES%\mipmap-mdpi" 2>nul
mkdir "%RES%\mipmap-hdpi" 2>nul
mkdir "%RES%\mipmap-xhdpi" 2>nul
mkdir "%RES%\mipmap-xxhdpi" 2>nul
mkdir "%RES%\mipmap-xxxhdpi" 2>nul
mkdir "%RES%\mipmap-anydpi-v26" 2>nul
mkdir "%RES%\drawable" 2>nul
mkdir "%RES%\drawable-land-hdpi" 2>nul
mkdir "%RES%\drawable-land-mdpi" 2>nul
mkdir "%RES%\drawable-land-xhdpi" 2>nul
mkdir "%RES%\drawable-land-xxhdpi" 2>nul
mkdir "%RES%\drawable-land-xxxhdpi" 2>nul
mkdir "%RES%\drawable-port-hdpi" 2>nul
mkdir "%RES%\drawable-port-mdpi" 2>nul
mkdir "%RES%\drawable-port-xhdpi" 2>nul
mkdir "%RES%\drawable-port-xxhdpi" 2>nul
mkdir "%RES%\drawable-port-xxxhdpi" 2>nul
mkdir "%RES%\values" 2>nul
echo Done!

echo.
echo [2/4] Updating app icons...
REM mipmap-mdpi
copy /Y "%SOURCE%" "%RES%\mipmap-mdpi\ic_launcher.png" >nul
copy /Y "%SOURCE%" "%RES%\mipmap-mdpi\ic_launcher_round.png" >nul
copy /Y "%SOURCE%" "%RES%\mipmap-mdpi\ic_launcher_foreground.png" >nul

REM mipmap-hdpi
copy /Y "%SOURCE%" "%RES%\mipmap-hdpi\ic_launcher.png" >nul
copy /Y "%SOURCE%" "%RES%\mipmap-hdpi\ic_launcher_round.png" >nul
copy /Y "%SOURCE%" "%RES%\mipmap-hdpi\ic_launcher_foreground.png" >nul

REM mipmap-xhdpi
copy /Y "%SOURCE%" "%RES%\mipmap-xhdpi\ic_launcher.png" >nul
copy /Y "%SOURCE%" "%RES%\mipmap-xhdpi\ic_launcher_round.png" >nul
copy /Y "%SOURCE%" "%RES%\mipmap-xhdpi\ic_launcher_foreground.png" >nul

REM mipmap-xxhdpi
copy /Y "%SOURCE%" "%RES%\mipmap-xxhdpi\ic_launcher.png" >nul
copy /Y "%SOURCE%" "%RES%\mipmap-xxhdpi\ic_launcher_round.png" >nul
copy /Y "%SOURCE%" "%RES%\mipmap-xxhdpi\ic_launcher_foreground.png" >nul

REM mipmap-xxxhdpi
copy /Y "%SOURCE%" "%RES%\mipmap-xxxhdpi\ic_launcher.png" >nul
copy /Y "%SOURCE%" "%RES%\mipmap-xxxhdpi\ic_launcher_round.png" >nul
copy /Y "%SOURCE%" "%RES%\mipmap-xxxhdpi\ic_launcher_foreground.png" >nul
echo Done! (15 icon files)

echo.
echo [3/4] Updating splash screens...
REM Default
copy /Y "%SOURCE%" "%RES%\drawable\splash.png" >nul

REM Landscape
copy /Y "%SOURCE%" "%RES%\drawable-land-hdpi\splash.png" >nul
copy /Y "%SOURCE%" "%RES%\drawable-land-mdpi\splash.png" >nul
copy /Y "%SOURCE%" "%RES%\drawable-land-xhdpi\splash.png" >nul
copy /Y "%SOURCE%" "%RES%\drawable-land-xxhdpi\splash.png" >nul
copy /Y "%SOURCE%" "%RES%\drawable-land-xxxhdpi\splash.png" >nul

REM Portrait
copy /Y "%SOURCE%" "%RES%\drawable-port-hdpi\splash.png" >nul
copy /Y "%SOURCE%" "%RES%\drawable-port-mdpi\splash.png" >nul
copy /Y "%SOURCE%" "%RES%\drawable-port-xhdpi\splash.png" >nul
copy /Y "%SOURCE%" "%RES%\drawable-port-xxhdpi\splash.png" >nul
copy /Y "%SOURCE%" "%RES%\drawable-port-xxxhdpi\splash.png" >nul
echo Done! (11 splash files)

echo.
echo [4/4] Creating configuration files...

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
echo     ^<!-- roshLingua Brand Color --^>
echo     ^<color name="ic_launcher_background"^>#3b82f6^</color^>
echo ^</resources^>
) > "%RES%\values\colors.xml"

echo Done! (3 config files)

echo.
echo ========================================
echo COMPLETE! All branding updated!
echo ========================================
echo.
echo Summary:
echo - 15 app icon files updated
echo - 11 splash screen files updated
echo - 3 configuration files created
echo - Total: 29 files updated
echo.
echo Your roshLingua logo is now:
echo  - App icon (all densities)
echo  - Splash screen (all orientations)
echo  - Adaptive icon (Android 8.0+)
echo.
echo Next steps:
echo 1. Run: npx cap sync android
echo 2. Build APK in Android Studio
echo 3. Enjoy your branded app!
echo.
pause
