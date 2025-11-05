# RoshLingua APK Setup - Quick Start

## Quick Setup Commands

### 1. Build Web App
```bash
npm run build
```

### 2. Install Capacitor
```bash
npm install -g @capacitor/cli
npm install @capacitor/core @capacitor/android @capacitor/ios @capacitor/app @capacitor/status-bar @capacitor/keyboard
```

### 3. Initialize Capacitor
```bash
npx cap init

# When prompted:
# App name: RoshLingua
# App Package ID: com.roshlingua.app
# Web dir: dist
```

### 4. Add Android Platform
```bash
npx cap add android
```

### 5. Sync Project
```bash
npx cap sync android
npx cap copy android
```

### 6. Build Debug APK
```bash
cd android
./gradlew assembleDebug
cd ..
```

**Debug APK Location:** `android/app/build/outputs/apk/debug/app-debug.apk`

### 7. Install on Device/Emulator
```bash
# Start emulator or connect device
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Custom Branding - Logo Setup

### Step 1: Prepare Logo Files

Create these files in `public/assets/icons/`:
- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)
- `icon-1024x1024.png` (1024x1024 pixels)
- `splash-2732x2732.png` (2732x2732 pixels)

### Step 2: Generate Android Icons

**Option A: Using Android Studio**
1. Open Android Studio
2. File > New > Image Asset
3. Select your logo file
4. Choose "Launcher Icons"
5. Generate for all densities

**Option B: Online Tool**
Visit: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
- Upload your logo
- Download generated icons
- Extract to `android/app/src/main/res/`

### Step 3: Update App Branding

Edit `android/app/src/main/res/values/strings.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">RoshLingua</string>
    <string name="title_activity_main">RoshLingua</string>
    <string name="package_name">com.roshlingua.app</string>
    <string name="custom_url_scheme">com.roshlingua.app</string>
</resources>
```

## Release Build (Production)

### 1. Create Keystore (One-time)
```bash
keytool -genkey -v -keystore roshlingua-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias roshlingua

# Enter:
# Keystore password: [strong password]
# Key password: [same password]
# Name: Roshan Kumar
# Organization: RoshLingua
# Country: IN
```

### 2. Create keystore.properties
Create `android/keystore.properties`:
```properties
storeFile=../roshlingua-release-key.keystore
storePassword=your_password
keyAlias=roshlingua
keyPassword=your_password
```

### 3. Update build.gradle
Edit `android/app/build.gradle`:
```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### 4. Build Release APK
```bash
cd android
./gradlew assembleRelease
cd ..
```

**Release APK Location:** `android/app/build/outputs/apk/release/app-release.apk`

## Testing

### Test on Emulator
```bash
# List emulators
emulator -list-avds

# Start emulator
emulator -avd Pixel_4_API_30

# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# View logs
adb logcat
```

### Test on Physical Device
```bash
# Enable USB Debugging on device
# Settings > Developer Options > USB Debugging

# Connect device
# Verify connection
adb devices

# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Upload to Google Play Store

### 1. Create Developer Account
- Visit: https://play.google.com/console
- Pay $25 registration fee
- Complete profile

### 2. Create App Listing
- Click "Create app"
- App name: "RoshLingua"
- Category: "Communication"
- Add description, screenshots, icons

### 3. Upload Release APK
- Go to Release > Production
- Click "Create new release"
- Upload `app-release.apk`
- Add release notes
- Review and publish

## Troubleshooting

### Gradle Build Fails
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### APK Won't Install
```bash
# Uninstall previous version
adb uninstall com.roshlingua.app

# Reinstall
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### App Crashes
```bash
# Check logs
adb logcat | grep RoshLingua

# Verify:
# - Supabase credentials
# - Internet permissions
# - Network connectivity
```

## Important Notes

⚠️ **Security:**
- Never commit keystore to git
- Keep keystore file backed up securely
- Use strong passwords
- Don't share keystore with others

📱 **Testing:**
- Test on multiple Android versions (API 24+)
- Test on different screen sizes
- Test offline functionality
- Test with slow network

🔄 **Updates:**
- Increment versionCode for each release
- Use semantic versioning (1.0.0, 1.0.1, etc.)
- Keep keystore for future updates

## Next Steps

1. ✅ Follow "Quick Setup Commands" above
2. ✅ Prepare logo files
3. ✅ Update branding
4. ✅ Build and test debug APK
5. ✅ Create release keystore
6. ✅ Build release APK
7. ✅ Upload to Google Play Store

For detailed information, see `APK_BUILD_GUIDE.md`
