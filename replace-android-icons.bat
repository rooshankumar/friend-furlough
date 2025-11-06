@echo off
echo ===================================================================
echo   REPLACING ANDROID DEFAULT ICONS WITH ROSHLINGUA LOGO
echo ===================================================================
echo.

REM Check if logo exists
if not exist "public\roshlingua-logo-192.png" (
    echo ERROR: Logo not found at public\roshlingua-logo-192.png
    pause
    exit /b 1
)

echo Found RoshLingua logo: public\roshlingua-logo-192.png
echo.

REM Create directories if they don't exist
mkdir "android\app\src\main\res\mipmap-mdpi" 2>nul
mkdir "android\app\src\main\res\mipmap-hdpi" 2>nul
mkdir "android\app\src\main\res\mipmap-xhdpi" 2>nul
mkdir "android\app\src\main\res\mipmap-xxhdpi" 2>nul
mkdir "android\app\src\main\res\mipmap-xxxhdpi" 2>nul
mkdir "android\app\src\main\res\drawable" 2>nul

echo Replacing icon files...
echo.

REM Copy to all mipmap folders
copy /Y "public\roshlingua-logo-192.png" "android\app\src\main\res\mipmap-mdpi\ic_launcher.png" >nul
copy /Y "public\roshlingua-logo-192.png" "android\app\src\main\res\mipmap-mdpi\ic_launcher_round.png" >nul
copy /Y "public\roshlingua-logo-192.png" "android\app\src\main\res\mipmap-mdpi\ic_launcher_foreground.png" >nul
echo   [OK] mipmap-mdpi (3 files)

copy /Y "public\roshlingua-logo-192.png" "android\app\src\main\res\mipmap-hdpi\ic_launcher.png" >nul
copy /Y "public\roshlingua-logo-192.png" "android\app\src\main\res\mipmap-hdpi\ic_launcher_round.png" >nul
copy /Y "public\roshlingua-logo-192.png" "android\app\src\main\res\mipmap-hdpi\ic_launcher_foreground.png" >nul
echo   [OK] mipmap-hdpi (3 files)

copy /Y "public\roshlingua-logo-192.png" "android\app\src\main\res\mipmap-xhdpi\ic_launcher.png" >nul
copy /Y "public\roshlingua-logo-192.png" "android\app\src\main\res\mipmap-xhdpi\ic_launcher_round.png" >nul
copy /Y "public\roshlingua-logo-192.png" "android\app\src\main\res\mipmap-xhdpi\ic_launcher_foreground.png" >nul
echo   [OK] mipmap-xhdpi (3 files)

copy /Y "public\roshlingua-logo-192.png" "android\app\src\main\res\mipmap-xxhdpi\ic_launcher.png" >nul
copy /Y "public\roshlingua-logo-192.png" "android\app\src\main\res\mipmap-xxhdpi\ic_launcher_round.png" >nul
copy /Y "public\roshlingua-logo-192.png" "android\app\src\main\res\mipmap-xxhdpi\ic_launcher_foreground.png" >nul
echo   [OK] mipmap-xxhdpi (3 files)

copy /Y "public\roshlingua-logo-192.png" "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png" >nul
copy /Y "public\roshlingua-logo-192.png" "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher_round.png" >nul
copy /Y "public\roshlingua-logo-192.png" "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher_foreground.png" >nul
echo   [OK] mipmap-xxxhdpi (3 files)

REM Add splash screen
if exist "public\roshlingua-logo-512.png" (
    copy /Y "public\roshlingua-logo-512.png" "android\app\src\main\res\drawable\splash.png" >nul
    echo   [OK] Splash screen (512px logo)
) else (
    copy /Y "public\roshlingua-logo-192.png" "android\app\src\main\res\drawable\splash.png" >nul
    echo   [OK] Splash screen (192px logo)
)

echo.
echo ===================================================================
echo   SUCCESS! All icons replaced (15 files + splash)
echo ===================================================================
echo.
echo NEXT STEPS:
echo   1. Open Android Studio
echo   2. Open folder: android\
echo   3. Build ^> Clean Project
echo   4. Build ^> Generate Signed Bundle / APK
echo   5. Select APK ^> Next
echo   6. Choose your keystore and build!
echo.
echo Ready to build in Android Studio!
echo.
pause
