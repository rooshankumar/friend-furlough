# RoshLingua - APK Build Guide

## Overview
This guide explains how to convert the RoshLingua React web app into an Android APK using Capacitor with custom branding.

## Prerequisites

### Required Software
1. **Node.js & npm** (already installed)
2. **Java Development Kit (JDK)** - Version 11 or higher
3. **Android Studio** - For Android SDK and emulator
4. **Android SDK** - API level 24 or higher
5. **Gradle** - Included with Android Studio

### Installation Steps

#### 1. Install Java Development Kit (JDK)
```bash
# Download from: https://www.oracle.com/java/technologies/downloads/
# Or use OpenJDK
# Windows: Download and install from oracle.com
# After installation, verify:
java -version
javac -version
```

#### 2. Install Android Studio
```bash
# Download from: https://developer.android.com/studio
# Install Android Studio
# During installation, select:
#   - Android SDK
#   - Android SDK Platform (API 24+)
#   - Android Virtual Device (AVD)
```

#### 3. Set Environment Variables (Windows)
Add to System Environment Variables:
```
JAVA_HOME = C:\Program Files\Java\jdk-11.0.x
ANDROID_HOME = C:\Users\YourUsername\AppData\Local\Android\Sdk
```

Add to PATH:
```
%JAVA_HOME%\bin
%ANDROID_HOME%\tools
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\cmdline-tools\latest\bin
```

Verify installation:
```bash
java -version
android --version
```

## Step 1: Build Web App

```bash
cd d:\Roshan\friend-furlough

# Build the production web app
npm run build

# This creates the 'dist' folder with optimized files
```

## Step 2: Install Capacitor

```bash
# Install Capacitor CLI globally
npm install -g @capacitor/cli

# Install Capacitor packages
npm install @capacitor/core @capacitor/android @capacitor/ios @capacitor/app @capacitor/status-bar @capacitor/keyboard
```

## Step 3: Initialize Capacitor Project

```bash
# Initialize Capacitor with RoshLingua branding
npx cap init

# When prompted, enter:
# App name: RoshLingua
# App Package ID: com.roshlingua.app
# Web dir: dist
```

This creates `capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.roshlingua.app',
  appName: 'RoshLingua',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
```

## Step 4: Add Android Platform

```bash
# Add Android platform
npx cap add android

# This creates the 'android' folder with Android project files
```

## Step 5: Custom Branding Setup

### 5.1 Prepare Logo Assets

Create logo files in the following sizes:

**Icon Sizes:**
- `icon-192x192.png` - 192x192 pixels
- `icon-512x512.png` - 512x512 pixels
- `icon-1024x1024.png` - 1024x1024 pixels (for app store)

**Splash Screen:**
- `splash-2732x2732.png` - 2732x2732 pixels

Place these in: `public/assets/icons/`

### 5.2 Generate Android Icons

Use Android Studio's built-in tool or online generator:

```bash
# Option 1: Using Android Studio
# File > New > Image Asset
# Select your logo
# Generate for all densities

# Option 2: Online tool
# https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
```

Generated files go to:
```
android/app/src/main/res/
  ├── mipmap-ldpi/ic_launcher.png
  ├── mipmap-mdpi/ic_launcher.png
  ├── mipmap-hdpi/ic_launcher.png
  ├── mipmap-xhdpi/ic_launcher.png
  ├── mipmap-xxhdpi/ic_launcher.png
  └── mipmap-xxxhdpi/ic_launcher.png
```

### 5.3 Update App Manifest

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme"
            android:launchMode="singleTask"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

    <!-- Required Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
</manifest>
```

### 5.4 Update App Strings

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

### 5.5 Update Build Gradle

Edit `android/app/build.gradle`:

```gradle
android {
    namespace "com.roshlingua.app"
    compileSdk 34

    defaultConfig {
        applicationId "com.roshlingua.app"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
}
```

## Step 6: Sync and Build

```bash
# Sync Capacitor with Android project
npx cap sync android

# Copy web assets to Android
npx cap copy android
```

## Step 7: Build APK

### Option 1: Debug APK (for testing)

```bash
cd android

# Build debug APK
./gradlew assembleDebug

# APK location: android/app/build/outputs/apk/debug/app-debug.apk
```

### Option 2: Release APK (for production)

#### 7.1 Create Keystore

```bash
# Generate keystore file (one-time only)
keytool -genkey -v -keystore roshlingua-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias roshlingua

# When prompted, enter:
# Keystore password: [create strong password]
# Key password: [same as keystore]
# First and last name: Roshan Kumar
# Organization: RoshLingua
# City: [Your City]
# State: [Your State]
# Country: IN

# Save this file securely - you'll need it for future updates!
```

#### 7.2 Configure Signing

Create `android/keystore.properties`:

```properties
storeFile=../roshlingua-release-key.keystore
storePassword=your_keystore_password
keyAlias=roshlingua
keyPassword=your_key_password
```

Update `android/app/build.gradle`:

```gradle
android {
    // ... existing config ...

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
}
```

#### 7.3 Build Release APK

```bash
cd android

# Build release APK
./gradlew assembleRelease

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

## Step 8: Test APK

### Using Emulator

```bash
# List available emulators
emulator -list-avds

# Start emulator
emulator -avd Pixel_4_API_30

# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or for release
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Using Physical Device

```bash
# Enable USB Debugging on device
# Settings > Developer Options > USB Debugging

# Connect device via USB
# Verify connection
adb devices

# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Step 9: Upload to Google Play Store

### 9.1 Create Google Play Developer Account

1. Visit: https://play.google.com/console
2. Sign in with Google account
3. Pay $25 registration fee
4. Complete developer profile

### 9.2 Create App Listing

1. Click "Create app"
2. Enter app name: "RoshLingua"
3. Select category: "Communication" or "Social"
4. Fill in app details:
   - Description
   - Screenshots (5-8 images)
   - Feature graphic (1024x500)
   - Icon (512x512)
   - Promo video (optional)

### 9.3 Upload APK

1. Go to "Release" > "Production"
2. Click "Create new release"
3. Upload `app-release.apk`
4. Add release notes
5. Review and publish

## Troubleshooting

### Issue: Gradle Build Fails
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleDebug
```

### Issue: APK Installation Fails
```bash
# Check device compatibility
adb shell getprop ro.build.version.sdk

# Uninstall previous version
adb uninstall com.roshlingua.app

# Reinstall
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Issue: App Crashes on Launch
- Check logcat: `adb logcat`
- Verify Supabase credentials in app
- Check internet permissions in AndroidManifest.xml

## File Structure

```
roshlingua/
├── android/
│   ├── app/
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── AndroidManifest.xml
│   │   │   │   ├── java/com/roshlingua/app/
│   │   │   │   └── res/
│   │   │   │       ├── mipmap-*/ic_launcher.png
│   │   │   │       ├── values/strings.xml
│   │   │   │       └── values/styles.xml
│   │   │   └── build.gradle
│   │   └── build.gradle
│   ├── gradle/
│   ├── build.gradle
│   ├── settings.gradle
│   └── gradlew
├── dist/
├── src/
├── capacitor.config.ts
├── package.json
└── roshlingua-release-key.keystore
```

## Version Management

Update version in `capacitor.config.ts` and `android/app/build.gradle`:

```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.roshlingua.app',
  appName: 'RoshLingua',
  webDir: 'dist',
  // ... other config
};
```

```gradle
// android/app/build.gradle
defaultConfig {
    versionCode 2  // Increment for each release
    versionName "1.0.1"  // Semantic versioning
}
```

## Security Checklist

- ✅ Store keystore file securely (backup to secure location)
- ✅ Never commit keystore to git
- ✅ Use strong passwords for keystore
- ✅ Enable ProGuard/R8 for release builds
- ✅ Test on multiple Android versions
- ✅ Verify Supabase credentials are environment-based
- ✅ Check all permissions are necessary
- ✅ Test offline functionality

## Next Steps

1. Install prerequisites (JDK, Android Studio)
2. Build web app: `npm run build`
3. Initialize Capacitor: `npx cap init`
4. Add Android: `npx cap add android`
5. Prepare custom logos and icons
6. Update branding (strings, manifest, icons)
7. Build debug APK for testing
8. Test on emulator/device
9. Create release keystore
10. Build release APK
11. Upload to Google Play Store

## Resources

- Capacitor Docs: https://capacitorjs.com/docs
- Android Developer: https://developer.android.com/
- Google Play Console: https://play.google.com/console
- Android Asset Studio: https://romannurik.github.io/AndroidAssetStudio/
