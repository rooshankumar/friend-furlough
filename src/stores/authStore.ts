import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  country?: string;
  country_code?: string;
  country_flag?: string;
  city?: string;
  age?: number;
  gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  online: boolean;
  last_seen?: string;
  onboarding_completed?: boolean;
  looking_for?: string[];
  language_goals?: string[];
  countries_visited?: string[];
  teaching_experience?: boolean;
  created_at: string;
  updated_at: string;
}

// Type guard for Profile
function isValidProfile(profile: any): profile is Profile {
  if (!profile || typeof profile !== 'object') return false;
  if (typeof profile.id !== 'string' || typeof profile.name !== 'string') return false;
  
  // Validate gender if present
  if (profile.gender && !['male', 'female', 'non-binary', 'prefer-not-to-say'].includes(profile.gender)) {
    profile.gender = 'prefer-not-to-say'; // Default to safe value
  }
  
  return true;
}

interface AuthState {
  user: SupabaseUser | null;
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onboardingStep: number;
  onboardingCompleted: boolean;

  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  setOnboardingStep: (step: number) => void;
  completeOnboarding: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      isAuthenticated: false,
      isLoading: true,
      onboardingStep: 1,
      onboardingCompleted: false,

      initialize: async () => {
        set({ isLoading: true });

        try {
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Auth initialization timeout')), 10000);
          });

          const sessionPromise = supabase.auth.getSession();

          const { data: { session } } = await Promise.race([
            sessionPromise,
            timeoutPromise
          ]) as any;

          if (session?.user) {
            set({
              user: session.user,
              isAuthenticated: true
            });

            // Load profile data with timeout
            const profilePromise = supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            const profileTimeout = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Profile load timeout')), 5000);
            });

            try {
              const { data: profile } = await Promise.race([
                profilePromise,
                profileTimeout
              ]) as any;

              if (profile) {
                set({
                  profile,
                  onboardingCompleted: Boolean(profile.onboarding_completed)
                });
              }
            } catch (profileError) {
              console.warn('Profile load failed or timed out:', profileError);
              // Continue without profile - it will load later
            }
          }

          console.log('✅ Auth initialized successfully');
          set({ isLoading: false });
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ isLoading: false, user: null, profile: null, isAuthenticated: false });
        }

        supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔐 Auth state changed:', event);
          
          if (event === 'SIGNED_IN' && session?.user) {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              set({
                session,
                user: session.user,
                profile: isValidProfile(profile) ? profile : null,
                isAuthenticated: true, // User is authenticated if they have a session
                onboardingCompleted: isValidProfile(profile) && profile.onboarding_completed === true,
                isLoading: false
              });
            } catch (error) {
              console.error('Failed to load profile on auth change:', error);
              // Still set as authenticated even if profile fails to load
              set({
                session,
                user: session.user,
                profile: null,
                isAuthenticated: true,
                onboardingCompleted: false,
                isLoading: false
              });
            }
          } else if (event === 'SIGNED_OUT') {
            set({
              user: null,
              session: null,
              profile: null,
              isAuthenticated: false,
              onboardingStep: 1,
              onboardingCompleted: false,
              isLoading: false
            });
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('🔄 Token refreshed successfully');
            // Update session but keep other state
            set({ session });
          }
        });
      },

      signUp: async (email, password, name) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name },
              emailRedirectTo: `${window.location.origin}/onboarding/cultural-profile`
            }
          });

          if (error) throw error;

          if (data.user) {
            // Check if email confirmation is required
            const emailConfirmationRequired = !data.session;

            // Create profile record immediately
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                name: name,
                online: true,
                onboarding_completed: false
              });

            if (profileError) {
              console.error('Profile creation error:', profileError);
              // Continue anyway - profile might be created by trigger
            }

            // If email confirmation is required, don't set as authenticated
            if (emailConfirmationRequired) {
              set({
                user: null,
                session: null,
                profile: null,
                isAuthenticated: false,
                isLoading: false,
                onboardingStep: 1,
                onboardingCompleted: false
              });
              // Throw special error to show email confirmation message
              throw new Error('CONFIRM_EMAIL');
            }

            // Fetch the profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            set({
              user: data.user,
              session: data.session,
              profile: isValidProfile(profile) ? profile : null,
              isAuthenticated: true,
              isLoading: false,
              onboardingStep: 1,
              onboardingCompleted: false
            });
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signIn: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (error) throw error;
          if (!data.user) throw new Error('No user returned from sign in');

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          set({
            user: data.user,
            session: data.session,
            profile: isValidProfile(profile) ? profile : null,
            isAuthenticated: true, // Always true if we have a user
            onboardingCompleted: isValidProfile(profile) && profile.onboarding_completed === true
          });
        } catch (error) {
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      signInWithGoogle: async () => {
        // Use mobile-optimized OAuth if on mobile
        const { signInWithGoogleMobile } = await import('@/lib/mobileAuth');
        return await signInWithGoogleMobile();
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({
          user: null,
          session: null,
          profile: null,
          isAuthenticated: false,
          onboardingStep: 1,
          onboardingCompleted: false
        });
      },

      updateProfile: async (updates) => {
        const { user } = get();
        if (!user) throw new Error('No user logged in');

        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);

        if (error) throw error;

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        set({ profile: isValidProfile(profile) ? profile : null });
      },

      setOnboardingStep: (step) => {
        set({ onboardingStep: step });
      },

      completeOnboarding: async () => {
        const { user, profile } = get();
        if (!user) return;

        // Check if core fields are filled: name, country, age, gender
        const isComplete = profile && profile.name && profile.country && profile.age && profile.gender;

        if (isComplete) {
          // Update database
          await supabase
            .from('profiles')
            .update({ onboarding_completed: true })
            .eq('id', user.id);
        }

        set({
          onboardingCompleted: isComplete ? true : false,
          onboardingStep: 1
        });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
        onboardingStep: state.onboardingStep,
        onboardingCompleted: state.onboardingCompleted,
      }),
    }
  )
);