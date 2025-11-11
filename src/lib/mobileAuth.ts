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

// Use custom scheme for mobile OAuth
// For web, use the Vercel deployment URL
const REDIRECT_URL = isMobileApp() 
  ? 'com.roshlingua.app://login-callback'
  : 'https://roshlingua.vercel.app/auth/callback';

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
    
    // Check if this is an OAuth callback (custom scheme or Supabase URL)
    if (data.url.includes('login-callback') || data.url.includes('supabase.co/auth/v1/callback')) {
      console.log('✅ OAuth callback detected, processing session...');
      
      try {
        console.log('🔐 Processing OAuth callback URL:', data.url);
        
        // Extract the URL - Supabase callback includes hash fragments
        const url = new URL(data.url);
        
        // Get the hash fragment (contains access_token, refresh_token, etc.)
        let hashParams = new URLSearchParams(url.hash.substring(1));
        
        // If no hash, check search params
        if (!hashParams.has('access_token')) {
          hashParams = new URLSearchParams(url.search);
        }
        
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        console.log('🔑 Token extraction:', { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken,
          hashFragment: url.hash,
          searchParams: url.search,
          fullUrl: data.url
        });
        
        if (accessToken && refreshToken) {
          console.log('✅ Setting session with tokens...');
          
          // Close browser before setting session
          await Browser.close().catch(() => {});
          
          // Set the session in Supabase
          const { data: sessionData, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) {
            console.error('❌ Error setting session:', error);
            alert('Login failed: ' + error.message);
          } else {
            console.log('✅ Session set successfully!', sessionData.user?.email);
            
            // Check onboarding status and redirect appropriately
            const { data: profile } = await supabase
              .from('profiles')
              .select('onboarding_completed')
              .eq('id', sessionData.user.id)
              .single();

            const onboardingCompleted = profile?.onboarding_completed || false;
            const redirectPath = onboardingCompleted ? '/explore' : '/onboarding/cultural-profile';
            
            console.log('📍 Redirecting to:', redirectPath, { onboardingCompleted });
            
            // Small delay before navigation
            setTimeout(() => {
              window.location.href = redirectPath;
            }, 500);
          }
        } else {
          console.warn('⚠️ No tokens found in callback URL');
          console.log('📋 Full URL for debugging:', data.url);
          
          // Try alternative parsing - sometimes the URL structure is different
          const urlString = data.url;
          const accessTokenMatch = urlString.match(/access_token=([^&]+)/);
          const refreshTokenMatch = urlString.match(/refresh_token=([^&]+)/);
          
          if (accessTokenMatch && refreshTokenMatch) {
            console.log('✅ Found tokens using regex fallback');
            await Browser.close().catch(() => {});
            
            const { error } = await supabase.auth.setSession({
              access_token: accessTokenMatch[1],
              refresh_token: refreshTokenMatch[1],
            });
            
            if (error) {
              console.error('❌ Error setting session (fallback):', error);
              alert('Login failed: ' + error.message);
            } else {
              console.log('✅ Session set successfully (fallback)!');
              
              // Check onboarding status and redirect appropriately
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData.session?.user) {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('onboarding_completed')
                  .eq('id', sessionData.session.user.id)
                  .single();

                const onboardingCompleted = profile?.onboarding_completed || false;
                const redirectPath = onboardingCompleted ? '/explore' : '/onboarding/cultural-profile';
                
                console.log('📍 Redirecting to:', redirectPath, { onboardingCompleted });
                
                setTimeout(() => {
                  window.location.href = redirectPath;
                }, 500);
              }
            }
          } else {
            await Browser.close().catch(() => {});
            alert('Login failed: No authentication tokens received');
          }
        }
      } catch (error) {
        console.error('❌ Error processing OAuth callback:', error);
        await Browser.close().catch(() => {});
        alert('Login error: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
