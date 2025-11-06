# Mobile File Upload Troubleshooting Guide

If you're experiencing issues with the mobile file upload functionality, follow this troubleshooting guide to identify and resolve common problems.

## Common Issues and Solutions

### 1. App Not Loading or Crashing on Start

**Possible causes:**
- Incorrect plugin configuration
- Missing permissions
- JavaScript errors in the web app

**Solutions:**
- Run `debug-mobile-upload.bat` to build a debug APK
- Check logs using `adb logcat *:E Capacitor:V CapacitorFilePicker:V`
- Debug the WebView using Chrome's remote debugging (chrome://inspect)

### 2. File Picker Not Opening

**Possible causes:**
- Missing permissions in AndroidManifest.xml
- Plugin not properly registered
- JavaScript errors in the file picker code

**Solutions:**
- Verify permissions in AndroidManifest.xml
- Check if the plugin is properly registered in MainActivity.java
- Debug the JavaScript code using Chrome's remote debugging

### 3. Permission Denied Errors

**Possible causes:**
- Missing or incorrect permissions in AndroidManifest.xml
- Runtime permissions not requested properly

**Solutions:**
- Verify the following permissions are in AndroidManifest.xml:
  ```xml
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />
  <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
  <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
  <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
  <uses-permission android:name="android.permission.CAMERA" />
  ```
- Implement proper runtime permission handling in the app

### 4. File Upload Fails

**Possible causes:**
- Network connectivity issues
- Server-side errors
- File size or type restrictions

**Solutions:**
- Check network connectivity
- Verify server-side file upload endpoint
- Check file size and type restrictions
- Add logging to track the upload process

## Debugging Tools

### ADB Logcat

To view logs from your app:

```bash
adb logcat *:E Capacitor:V CapacitorFilePicker:V CapacitorHttp:V
```

### Chrome Remote Debugging

1. Connect your device via USB
2. Enable USB debugging on your device
3. Open Chrome on your computer
4. Navigate to chrome://inspect
5. Find your app under "Remote Target"
6. Click "inspect" to open the DevTools

### Capacitor Plugin Logs

To enable verbose logging for Capacitor plugins, add this to your app's initialization code:

```javascript
import { CapacitorLogging } from '@capacitor/core';

// Enable verbose logging
CapacitorLogging.enable({
  level: 'verbose'
});
```

## Checking Plugin Installation

To verify that plugins are correctly installed:

1. Check `package.json` for the plugin dependencies
2. Verify the plugins are listed in `capacitor.config.ts`
3. Check that the plugins are properly registered in MainActivity.java
4. Verify the plugins are included in the APK by examining the build output

## Rebuilding the App

If you've made changes to fix issues, follow these steps to rebuild:

1. Run `npm run build` to build the web app
2. Run `npx cap sync` to sync the web app with Capacitor
3. Run `cd android && ./gradlew assembleDebug` to build the debug APK
4. Run `adb install -r app/build/outputs/apk/debug/app-debug.apk` to install on your device

## Getting Help

If you're still experiencing issues after following this guide, try:

1. Checking the Capacitor documentation for the specific plugins
2. Looking for similar issues in the Capacitor GitHub repository
3. Posting your issue on Stack Overflow with the `capacitor` tag
4. Contacting the plugin maintainers for specific plugin issues
