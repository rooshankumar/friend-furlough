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
      isLoading: false,
      onboardingStep: 1,
      onboardingCompleted: false,
      
      initialize: async () => {
        set({ isLoading: true });
        
        // Set up auth state listener
        supabase.auth.onAuthStateChange(async (event, session) => {
          set({ session, user: session?.user ?? null });
          
          if (session?.user) {
            // Fetch profile data
            const { data: profile } = await supabase
              .from('profiles' as any)
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            set({ 
              profile,
              isAuthenticated: true,
              onboardingCompleted: profile?.country ? true : false
            });
          } else {
            set({ 
              profile: null, 
              isAuthenticated: false,
              onboardingCompleted: false
            });
          }
          set({ isLoading: false });
        });
        
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles' as any)
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          set({ 
            session,
            user: session.user,
            profile,
            isAuthenticated: true,
            onboardingCompleted: profile?.country ? true : false,
            isLoading: false
          });
        } else {
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
          
          // Fetch profile after signup
          if (data.user) {
            const { data: profile } = await supabase
              .from('profiles' as any)
              .select('*')
              .eq('id', data.user.id)
              .single();
            
            set({ 
              user: data.user,
              session: data.session,
              profile,
              isAuthenticated: true,
              isLoading: false,
              onboardingStep: 2,
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
          
          const { data: profile } = await supabase
            .from('profiles' as any)
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          set({ 
            user: data.user,
            session: data.session,
            profile,
            isAuthenticated: true,
            isLoading: false,
            onboardingCompleted: profile?.country ? true : false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
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
          .from('profiles' as any)
          .update(updates as any)
          .eq('id', user.id);
        
        if (error) throw error;
        
        const { data: profile } = await supabase
          .from('profiles' as any)
          .select('*')
          .eq('id', user.id)
          .single();
        
        set({ profile });
      },
      
      setOnboardingStep: (step) => {
        set({ onboardingStep: step });
      },
      
      completeOnboarding: async () => {
        const { user } = get();
        if (!user) return;
        
        set({ onboardingCompleted: true, onboardingStep: 1 });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        onboardingStep: state.onboardingStep,
        onboardingCompleted: state.onboardingCompleted,
      }),
    }
  )
);