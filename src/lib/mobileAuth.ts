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

// Use custom scheme for OAuth redirect on mobile
// For Android, use app link format that matches AndroidManifest.xml intent filter
const REDIRECT_URL = isMobileApp() 
  ? 'com.roshlingua.app://oauth-callback'
  : 'https://bblrxervgwkphkctdghe.supabase.co/auth/v1/callback';

/**
 * Initialize OAuth deep link listener
 * Call this once when app starts
 */
export const initOAuthListener = () => {
  if (!isMobileApp()) return;

  console.log('🔐 Initializing OAuth deep link listener...');

  // Listen for deep link URLs (Supabase callback)
  App.addListener('appUrlOpen', async (data) => {
    console.log('🔗 Deep link received:', data.url);
    
    // Check if this is a Supabase OAuth callback (both HTTPS and custom scheme)
    if (data.url.includes('supabase.co/auth/v1/callback') || data.url.includes('oauth-callback')) {
      console.log('OAuth callback detected, processing session...');
      
      try {
        // Close the browser first
        await Browser.close().catch(() => {});
        
        // Extract the URL - Supabase callback includes hash fragments
        const url = new URL(data.url);
        
        // Get the hash fragment (contains access_token, refresh_token, etc.)
        let hashParams = new URLSearchParams(url.hash.substring(1));
        
        // If no hash, check search params (some OAuth flows use query params)
        if (!hashParams.has('access_token')) {
          hashParams = new URLSearchParams(url.search);
        }
        
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          console.log('✅ Tokens found, setting session...');
          
          // Set the session in Supabase
          const { data: sessionData, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) {
            console.error('❌ Error setting session:', error);
          } else {
            console.log('✅ Session set successfully!', sessionData.user?.email);
            
            // Navigate to home or appropriate page
            window.location.href = '/';
          }
        } else {
          console.warn('⚠️ No tokens found in callback URL');
          console.log('Hash params:', Array.from(hashParams.entries()));
          console.log('Search params:', Array.from(new URLSearchParams(url.search).entries()));
        }
      } catch (error) {
        console.error('❌ Error processing OAuth callback:', error);
      }
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
