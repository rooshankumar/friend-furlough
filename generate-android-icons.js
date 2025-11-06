const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Android Icon Generator
 * Generates all required Android app icons from your logo
 */

const SOURCE_LOGO = path.join(__dirname, 'public', 'roshlingua-logo-512.png');
const RES_DIR = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

// Android icon sizes for different densities
const ICON_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

// Foreground icon sizes (larger for adaptive icons)
const FOREGROUND_SIZES = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432
};

console.log('🎨 Android Icon Generator for roshLingua\n');

// Check if source logo exists
if (!fs.existsSync(SOURCE_LOGO)) {
  console.error('❌ Error: Source logo not found at:', SOURCE_LOGO);
  console.log('Please ensure roshlingua-logo-512.png exists in the public folder');
  process.exit(1);
}

console.log('✓ Found source logo:', SOURCE_LOGO);

// Check if ImageMagick is installed (for resizing)
let hasImageMagick = false;
try {
  execSync('magick -version', { stdio: 'ignore' });
  hasImageMagick = true;
  console.log('✓ ImageMagick detected\n');
} catch (e) {
  console.log('⚠ ImageMagick not found. Will copy source logo to all sizes.');
  console.log('For best results, install ImageMagick: https://imagemagick.org/\n');
}

// Function to resize image using ImageMagick
function resizeImage(inputPath, outputPath, size) {
  try {
    const command = `magick "${inputPath}" -resize ${size}x${size} "${outputPath}"`;
    execSync(command, { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

// Function to copy file
function copyFile(source, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(source, dest);
}

// Generate launcher icons
console.log('📱 Generating launcher icons...');
Object.entries(ICON_SIZES).forEach(([density, size]) => {
  const dir = path.join(RES_DIR, density);
  fs.mkdirSync(dir, { recursive: true });
  
  const outputPath = path.join(dir, 'ic_launcher.png');
  
  if (hasImageMagick) {
    if (resizeImage(SOURCE_LOGO, outputPath, size)) {
      console.log(`  ✓ ${density}/ic_launcher.png (${size}x${size})`);
    } else {
      copyFile(SOURCE_LOGO, outputPath);
      console.log(`  ⚠ ${density}/ic_launcher.png (copied, not resized)`);
    }
  } else {
    copyFile(SOURCE_LOGO, outputPath);
    console.log(`  ✓ ${density}/ic_launcher.png (copied)`);
  }
});

// Generate round launcher icons
console.log('\n🔵 Generating round launcher icons...');
Object.entries(ICON_SIZES).forEach(([density, size]) => {
  const dir = path.join(RES_DIR, density);
  const outputPath = path.join(dir, 'ic_launcher_round.png');
  
  if (hasImageMagick) {
    // Create round icon with ImageMagick
    try {
      const command = `magick "${SOURCE_LOGO}" -resize ${size}x${size} -gravity center -background none -extent ${size}x${size} ( +clone -threshold -1 -negate -fill white -draw "circle ${size/2},${size/2} ${size/2},0" ) -alpha off -compose copy_opacity -composite "${outputPath}"`;
      execSync(command, { stdio: 'ignore' });
      console.log(`  ✓ ${density}/ic_launcher_round.png (${size}x${size})`);
    } catch (e) {
      copyFile(SOURCE_LOGO, outputPath);
      console.log(`  ⚠ ${density}/ic_launcher_round.png (copied, not rounded)`);
    }
  } else {
    copyFile(SOURCE_LOGO, outputPath);
    console.log(`  ✓ ${density}/ic_launcher_round.png (copied)`);
  }
});

// Generate foreground icons for adaptive icons
console.log('\n🎯 Generating foreground icons (adaptive)...');
Object.entries(FOREGROUND_SIZES).forEach(([density, size]) => {
  const dir = path.join(RES_DIR, density);
  const outputPath = path.join(dir, 'ic_launcher_foreground.png');
  
  if (hasImageMagick) {
    if (resizeImage(SOURCE_LOGO, outputPath, size)) {
      console.log(`  ✓ ${density}/ic_launcher_foreground.png (${size}x${size})`);
    } else {
      copyFile(SOURCE_LOGO, outputPath);
      console.log(`  ⚠ ${density}/ic_launcher_foreground.png (copied, not resized)`);
    }
  } else {
    copyFile(SOURCE_LOGO, outputPath);
    console.log(`  ✓ ${density}/ic_launcher_foreground.png (copied)`);
  }
});

// Create adaptive icon XML files
console.log('\n📄 Creating adaptive icon XML files...');
const adaptiveDir = path.join(RES_DIR, 'mipmap-anydpi-v26');
fs.mkdirSync(adaptiveDir, { recursive: true });

const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;

fs.writeFileSync(path.join(adaptiveDir, 'ic_launcher.xml'), adaptiveIconXml);
console.log('  ✓ mipmap-anydpi-v26/ic_launcher.xml');

fs.writeFileSync(path.join(adaptiveDir, 'ic_launcher_round.xml'), adaptiveIconXml);
console.log('  ✓ mipmap-anydpi-v26/ic_launcher_round.xml');

// Update colors.xml with brand color
console.log('\n🎨 Updating launcher background color...');
const valuesDir = path.join(RES_DIR, 'values');
fs.mkdirSync(valuesDir, { recursive: true });

const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- roshLingua Brand Color -->
    <color name="ic_launcher_background">#3b82f6</color>
</resources>`;

fs.writeFileSync(path.join(valuesDir, 'colors.xml'), colorsXml);
console.log('  ✓ values/colors.xml (using brand blue #3b82f6)');

console.log('\n✅ All Android icons generated successfully!');
console.log('\n📋 Next steps:');
console.log('1. Run: npx cap sync android');
console.log('2. Build APK in Android Studio');
console.log('3. Your custom logo will appear as the app icon!');

if (!hasImageMagick) {
  console.log('\n💡 Tip: Install ImageMagick for properly resized icons:');
  console.log('   https://imagemagick.org/script/download.php');
}
