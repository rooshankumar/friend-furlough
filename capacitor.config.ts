import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.roshlingua.app',
  appName: 'roshLingua',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true, // Allow cleartext for development
    // Comment out hostname for local development
    // hostname: 'app.roshlingua.com'
  },
  android: {
    // Development settings
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    // Splash screen configuration
    backgroundColor: '#ffffff',
    // Enable debugging
    loggingBehavior: 'debug'
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
    FilePicker: {
      // No special config needed
    },
    Filesystem: {
      // No special config needed
    },
    // Disable hostname validation for development
    CapacitorHttp: {
      // Enable native HTTP requests
      enabled: true
    }
  }
};

export default config;
