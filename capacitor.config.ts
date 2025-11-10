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
    // Splash screen configuration - Match PWA black theme
    backgroundColor: '#000000',
    // Enable debugging
    loggingBehavior: 'debug'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      spinnerColor: '#3b82f6'
    },
    // Optimize keyboard behavior for better UX
    Keyboard: {
      resize: 'ionic', // Better resize behavior
      style: 'dark',
      resizeOnFullScreen: true,
      // Additional keyboard optimization
      accessoryBarVisible: true,
      hideFormAccessoryBar: false
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
