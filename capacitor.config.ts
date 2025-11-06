import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.roshlingua.app',
  appName: 'roshLingua',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
    // Enable for faster loading
    hostname: 'app.roshlingua.com'
  },
  android: {
    // Optimize for performance
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // Splash screen configuration
    backgroundColor: '#ffffff',
    // Enable hardware acceleration
    loggingBehavior: 'production'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      spinnerColor: '#3b82f6'
    },
    // Optimize keyboard behavior
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    },
    // File handling plugins
    CapacitorFilePicker: {
      // No special config needed
    },
    CapacitorFilesystem: {
      // No special config needed
    },
    // Permission handling
    CapacitorPermissions: {
      // No special config needed
    }
  }
};

export default config;
