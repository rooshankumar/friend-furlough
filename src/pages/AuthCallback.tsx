import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { LoadingSpinner } from '@/components/LoadingStates';

/**
 * OAuth Callback Handler
 * Handles the OAuth redirect from Supabase and processes the session
 */
const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔐 Auth callback page loaded');
        
        // Get the URL hash or search params
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        // Try to get tokens from hash first, then search params
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
        
        console.log('🔑 Tokens found:', { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken 
        });

        if (accessToken && refreshToken) {
          // Set the session in Supabase
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('❌ Error setting session:', error);
            navigate('/auth/signin?error=session_failed');
            return;
          }

          console.log('✅ Session set successfully!', data.user?.email);
          
          // Check if user has completed onboarding
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', data.user.id)
            .single();

          const onboardingCompleted = profile?.onboarding_completed || false;
          const redirectPath = onboardingCompleted ? '/explore' : '/onboarding/cultural-profile';
          
          console.log('📍 Redirecting to:', redirectPath, { onboardingCompleted });
          
          // If on mobile, use deep link to return to app
          if (Capacitor.isNativePlatform()) {
            // Redirect to custom scheme with tokens
            window.location.href = `com.roshlingua.app://login-callback#access_token=${accessToken}&refresh_token=${refreshToken}`;
          } else {
            // On web, navigate based on onboarding status
            navigate(redirectPath);
          }
        } else {
          console.error('❌ No tokens found in callback');
          navigate('/auth/signin?error=no_tokens');
        }
      } catch (error) {
        console.error('❌ Error processing callback:', error);
        navigate('/auth/signin?error=callback_failed');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
