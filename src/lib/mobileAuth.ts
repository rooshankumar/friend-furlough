import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';

/**
 * Mobile OAuth Authentication Utility
 * Handles in-app OAuth flow for mobile devices
 */

// Check if running on mobile
export const isMobileApp = () => {
  return Capacitor.isNativePlatform();
};

// Use HTTPS URL for OAuth redirect (required by Google)
// This will work with Android App Links
const REDIRECT_URL = 'https://bblrxervgwkphkctdghe.supabase.co/auth/v1/callback';

/**
 * Initialize OAuth deep link listener
 * Call this once when app starts
 */
export const initOAuthListener = () => {
  if (!isMobileApp()) return;

  // Listen for deep link URLs (Supabase callback)
  App.addListener('appUrlOpen', async (data) => {
    console.log('Deep link received:', data.url);
    
    // Check if this is a Supabase OAuth callback
    if (data.url.includes('supabase.co/auth/v1/callback')) {
      // Extract the URL fragments/params
      const url = new URL(data.url);
      
      // Supabase will handle the session from the URL
      // The auth state change listener in authStore will pick it up
      console.log('OAuth callback received, session will be handled by Supabase');
      
      // Close the browser if still open
      await Browser.close().catch(() => {});
    }
  });
};

/**
 * Sign in with Google using in-app browser
 */
export const signInWithGoogleMobile = async () => {
  try {
    if (!isMobileApp()) {
      // Fallback to web OAuth
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      return { error };
    }

    // Mobile: Use in-app browser with deep link redirect
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: REDIRECT_URL,
        skipBrowserRedirect: true, // Don't auto-redirect, we'll handle it
      },
    });

    if (error) {
      console.error('OAuth error:', error);
      return { error };
    }

    if (data?.url) {
      // Open OAuth URL in in-app browser
      await Browser.open({
        url: data.url,
        presentationStyle: 'popover', // or 'fullscreen'
        toolbarColor: '#3b82f6', // Your primary color
      });

      // Browser will close automatically when redirect happens
      // The deep link listener will catch the callback
    }

    return { error: null };
  } catch (err) {
    console.error('Mobile OAuth error:', err);
    return { 
      error: { 
        message: err instanceof Error ? err.message : 'OAuth failed' 
      } 
    };
  }
};

/**
 * Close the in-app browser (if needed)
 */
export const closeOAuthBrowser = async () => {
  if (isMobileApp()) {
    await Browser.close();
  }
};

/**
 * Remove OAuth listener (cleanup)
 */
export const removeOAuthListener = () => {
  if (isMobileApp()) {
    App.removeAllListeners();
  }
};
