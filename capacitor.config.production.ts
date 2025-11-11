import type { CapacitorConfig } from '@capacitor/cli';

/**
 * PRODUCTION CAPACITOR CONFIGURATION
 * Use this for building release APKs
 * 
 * To use: Copy this to capacitor.config.ts before building release APK
 */

const config: CapacitorConfig = {
  appId: 'com.roshlingua.app',
  appName: 'roshLingua',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false, // PRODUCTION: Disable cleartext traffic
    // hostname: 'app.roshlingua.com' // Optional: Set your domain
  },
  android: {
    // PRODUCTION SETTINGS
    allowMixedContent: false, // Disable mixed content
    captureInput: true,
    webContentsDebuggingEnabled: false, // Disable debugging in production
    backgroundColor: '#000000',
    loggingBehavior: 'production', // Production logging only
    
    // Build optimizations
    buildOptions: {
      keystorePath: 'roshlingua-release.keystore',
      keystoreAlias: 'roshlingua',
      // Passwords should be in environment variables in real production
      // keystorePassword: process.env.KEYSTORE_PASSWORD,
      // keystoreAliasPassword: process.env.KEY_PASSWORD,
    }
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
    Keyboard: {
      resize: 'ionic',
      style: 'dark',
      resizeOnFullScreen: true,
      accessoryBarVisible: true,
      hideFormAccessoryBar: false
    },
    CapacitorHttp: {
      enabled: true
    },
    // Performance optimizations
    App: {
      // Disable app state restoration for faster startup
      restoreState: false
    }
  }
};

export default config;
