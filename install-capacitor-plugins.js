/**
 * Script to install required Capacitor plugins for mobile file uploads
 * Run with: node install-capacitor-plugins.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define plugins to install
const plugins = [
  '@capacitor/core',
  '@capacitor/cli',
  '@capacitor/android',
  '@capacitor/ios',
  '@capacitor/file-picker',
  '@capacitor/filesystem',
  '@capacitor/permissions'
];

console.log('📱 Installing Capacitor plugins for mobile file uploads...');

// Install each plugin
plugins.forEach(plugin => {
  try {
    console.log(`📦 Installing ${plugin}...`);
    execSync(`npm install ${plugin} --save`, { stdio: 'inherit' });
    console.log(`✅ ${plugin} installed successfully`);
  } catch (error) {
    console.error(`❌ Failed to install ${plugin}:`, error.message);
    process.exit(1);
  }
});

console.log('🔄 Syncing Capacitor project...');

// Sync Capacitor project
try {
  execSync('npx cap sync', { stdio: 'inherit' });
  console.log('✅ Capacitor project synced successfully');
} catch (error) {
  console.error('❌ Failed to sync Capacitor project:', error.message);
}

console.log('\n✅ All Capacitor plugins installed successfully!');
console.log('\nNext steps:');
console.log('1. Build your web app: npm run build');
console.log('2. Sync Capacitor again: npx cap sync');
console.log('3. Open Android Studio: npx cap open android');
console.log('4. Build and run the app on your device');
