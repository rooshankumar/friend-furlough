@echo off
echo ========================================
echo roshLingua Splash Screen Generator
echo ========================================
echo.

echo Updating splash screens with your logo...
echo.

set SOURCE=public\roshlingua-logo-512.png
set RES=android\app\src\main\res

REM Create directories if they don't exist
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

echo Copying to drawable (default)...
copy /Y "%SOURCE%" "%RES%\drawable\splash.png" >nul

echo Copying to landscape orientations...
copy /Y "%SOURCE%" "%RES%\drawable-land-hdpi\splash.png" >nul
copy /Y "%SOURCE%" "%RES%\drawable-land-mdpi\splash.png" >nul
copy /Y "%SOURCE%" "%RES%\drawable-land-xhdpi\splash.png" >nul
copy /Y "%SOURCE%" "%RES%\drawable-land-xxhdpi\splash.png" >nul
copy /Y "%SOURCE%" "%RES%\drawable-land-xxxhdpi\splash.png" >nul

echo Copying to portrait orientations...
copy /Y "%SOURCE%" "%RES%\drawable-port-hdpi\splash.png" >nul
copy /Y "%SOURCE%" "%RES%\drawable-port-mdpi\splash.png" >nul
copy /Y "%SOURCE%" "%RES%\drawable-port-xhdpi\splash.png" >nul
copy /Y "%SOURCE%" "%RES%\drawable-port-xxhdpi\splash.png" >nul
copy /Y "%SOURCE%" "%RES%\drawable-port-xxxhdpi\splash.png" >nul

echo.
echo ========================================
echo SUCCESS! All splash screens updated!
echo ========================================
echo.
echo Your roshLingua logo is now the splash screen.
echo.
echo Splash screens updated:
echo - drawable/splash.png (default)
echo - drawable-land-hdpi/splash.png (landscape)
echo - drawable-land-mdpi/splash.png
echo - drawable-land-xhdpi/splash.png
echo - drawable-land-xxhdpi/splash.png
echo - drawable-land-xxxhdpi/splash.png
echo - drawable-port-hdpi/splash.png (portrait)
echo - drawable-port-mdpi/splash.png
echo - drawable-port-xhdpi/splash.png
echo - drawable-port-xxhdpi/splash.png
echo - drawable-port-xxxhdpi/splash.png
echo.
echo Next steps:
echo 1. Run: npx cap sync android
echo 2. Build APK in Android Studio
echo 3. Your splash screen will show your logo!
echo.
pause
