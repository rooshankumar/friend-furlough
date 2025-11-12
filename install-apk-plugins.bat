@echo off
echo Installing APK optimization plugins...

echo Installing Capacitor push notifications...
npm install @capacitor/push-notifications

echo Installing Capacitor local notifications...
npm install @capacitor/local-notifications

echo Installing Capacitor status bar...
npm install @capacitor/status-bar

echo Installing Capacitor network...
npm install @capacitor/network

echo Installing Capacitor keyboard...
npm install @capacitor/keyboard

echo Installing Capacitor app...
npm install @capacitor/app

echo Syncing Android project...
npx cap sync android

echo APK plugins installed successfully!
echo You can now build the APK with optimized features.
pause
