// Type guard for Profile
function isValidProfile(profile: any): profile is Profile {
  return (
    profile &&
    typeof profile === 'object' &&
    typeof profile.id === 'string' &&
    typeof profile.name === 'string'
  );
}
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
  age?: number;
  online: boolean;
  last_seen?: string;
  created_at: string;
  updated_at: string;
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
          // Check for existing session first
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            set({
              session,
              user: session.user,
              profile: isValidProfile(profile) ? profile : null,
              isAuthenticated: isValidProfile(profile),
              onboardingCompleted: isValidProfile(profile) && profile.country ? true : false,
              isLoading: false
            });
          } else {
            set({ isLoading: false });
          }

          // Set up minimal auth state listener
          supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              set({
                session,
                user: session.user,
                profile: isValidProfile(profile) ? profile : null,
                isAuthenticated: isValidProfile(profile),
                onboardingCompleted: isValidProfile(profile) && profile.country ? true : false,
                isLoading: false
              });
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
            } else if (event === 'TOKEN_REFRESHED' && session) {
              set({ session, isLoading: false });
            }
          });
        } catch (error) {
          console.error('Initialize error:', error);
          set({ isLoading: false });
        }
      },
      
      signUp: async (email, password, name) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name },
              emailRedirectTo: `${window.location.origin}/`
            }
          });
          
          if (error) throw error;
          
          // Profile will be created by trigger, just set basic state
          if (data.user) {
            set({
              user: data.user,
              session: data.session,
              profile: null,
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
          if (error) {
            console.error('Supabase signIn error:', error);
            throw error;
          }
          if (!data.user) {
            console.error('No user returned from signInWithPassword:', data);
            throw new Error('No user returned from sign in');
          }
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          if (profileError) {
            console.error('Profile fetch error after sign in:', profileError);
            throw profileError;
          }
          set({
            user: data.user,
            session: data.session,
            profile: isValidProfile(profile) ? profile : null,
            isAuthenticated: isValidProfile(profile),
            onboardingCompleted: isValidProfile(profile) && profile.country ? true : false
          });
        } catch (error) {
          console.error('SignIn error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      signInWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/`,
          },
        });
        return { error };
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
        
        // Check if profile has all required fields
        const isComplete = profile && profile.country && profile.name;
        
        set({ 
          onboardingCompleted: isComplete ? true : false, 
          onboardingStep: 1 
        });
      }
    }),
    {
      name: 'auth-storage',
      // Persist all relevant auth state for session continuity
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