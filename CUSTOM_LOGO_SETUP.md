# RoshLingua - Custom Logo Setup Guide

## Current Status

✅ Your RoshLingua logos are available in `public/`:
- `roshlingua-logo-192.png` (192x192)
- `roshlingua-logo-512.png` (512x512)
- `roshlingua-logo-maskable.png` (maskable)

❌ Android is currently using default Capacitor icons

## How to Replace with Your Logo

### Method 1: Using Android Studio (Recommended)

1. **Open Android Studio**
   - File > Open > `d:\Roshan\friend-furlough\android`

2. **Create Image Asset**
   - Right-click `res` folder
   - New > Image Asset
   - Select "Launcher Icons"

3. **Import Your Logo**
   - Click "Browse" next to "Image file"
   - Select: `d:\Roshan\friend-furlough\public\roshlingua-logo-512.png`
   - Click "Next"

4. **Configure**
   - Name: `ic_launcher`
   - Foreground: Your logo
   - Background: White or transparent
   - Click "Finish"

5. **Android Studio Generates**
   - Automatically creates all sizes:
     - ldpi (36x36)
     - mdpi (48x48)
     - hdpi (72x72)
     - xhdpi (96x96)
     - xxhdpi (144x144)
     - xxxhdpi (192x192)

### Method 2: Manual Replacement

If you have pre-sized icons, replace these files:

```
android/app/src/main/res/
├── mipmap-ldpi/ic_launcher.png (36x36)
├── mipmap-mdpi/ic_launcher.png (48x48)
├── mipmap-hdpi/ic_launcher.png (72x72)
├── mipmap-xhdpi/ic_launcher.png (96x96)
├── mipmap-xxhdpi/ic_launcher.png (144x144)
└── mipmap-xxxhdpi/ic_launcher.png (192x192)
```

### Method 3: Online Icon Generator

1. Visit: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html

2. Upload your logo:
   - Select: `roshlingua-logo-512.png`

3. Configure:
   - Foreground: Your logo
   - Background: White or transparent
   - Shape: Square or Circle

4. Download generated icons

5. Extract to `android/app/src/main/res/`

## Icon Sizes Required

| Density | Size | DPI |
|---------|------|-----|
| ldpi | 36x36 | 120 |
| mdpi | 48x48 | 160 |
| hdpi | 72x72 | 240 |
| xhdpi | 96x96 | 320 |
| xxhdpi | 144x144 | 480 |
| xxxhdpi | 192x192 | 640 |

## Splash Screen (Optional)

To add a custom splash screen:

1. Create splash image: 2732x2732 pixels
2. Place in: `android/app/src/main/res/drawable/splash.png`
3. Update `capacitor.config.ts`:

```typescript
plugins: {
  SplashScreen: {
    launchShowDuration: 3000,
    launchAutoHide: true,
    backgroundColor: '#ffffff',
    androidScaleType: 'CENTER_CROP',
    showSpinner: false,
  },
}
```

## App Name & Branding

### Change App Name

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

### Change Theme Colors

Edit `android/app/src/main/res/values/styles.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <!-- Your brand colors -->
        <item name="colorPrimary">@color/primary</item>
        <item name="colorPrimaryDark">@color/primary_dark</item>
        <item name="colorAccent">@color/accent</item>
    </style>
</resources>
```

## Verify Logo in App

1. **Build APK**
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

2. **Install on Device/Emulator**
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

3. **Check Home Screen**
   - Your custom RoshLingua logo should appear
   - App name should be "RoshLingua"

## Icon Design Best Practices

✅ **Do:**
- Use solid colors for better visibility
- Ensure logo works at small sizes (36x36)
- Use transparent background for flexibility
- Test on different Android versions
- Keep logo centered and padded

❌ **Don't:**
- Use text-only logos (hard to read small)
- Use gradients (may not scale well)
- Use very thin lines (disappear at small sizes)
- Use too many colors (reduce to 3-4)

## Troubleshooting

### Logo Not Showing

1. Clean build:
   ```bash
   cd android
   ./gradlew clean
   ./gradlew assembleDebug
   ```

2. Uninstall app:
   ```bash
   adb uninstall com.roshlingua.app
   ```

3. Reinstall:
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Logo Looks Blurry

- Ensure source image is high quality (512x512 minimum)
- Use PNG format with transparency
- Avoid scaling up small images

### Icon Not Updating

- Clear Android Studio cache: File > Invalidate Caches
- Rebuild project
- Restart Android Studio

## Current Logo Files

**Available in `public/`:**
- `roshlingua-logo-192.png` - 192x192 pixels
- `roshlingua-logo-512.png` - 512x512 pixels
- `roshlingua-logo-maskable.png` - For adaptive icons

**Recommended:**
- Use `roshlingua-logo-512.png` for Android icon generation
- It's large enough for all required sizes

## Next Steps

1. ✅ Open Android Studio
2. ✅ Right-click `res` folder
3. ✅ New > Image Asset
4. ✅ Select `roshlingua-logo-512.png`
5. ✅ Generate icons
6. ✅ Build APK
7. ✅ Verify logo appears

## Files to Update

| File | Purpose |
|------|---------|
| `mipmap-*/ic_launcher.png` | App icon (all sizes) |
| `strings.xml` | App name |
| `styles.xml` | Theme colors |
| `capacitor.config.ts` | Splash screen |

## Result

After following this guide:
- ✅ App icon will be your RoshLingua logo
- ✅ App name will be "RoshLingua"
- ✅ Custom branding throughout
- ✅ Professional appearance

## Support

For detailed Android icon guidelines:
- https://developer.android.com/guide/practices/ui_guidelines/icon_design_launcher
- https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
