import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onboardingStep: number;
  onboardingCompleted: boolean;
  
  // Actions
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (updates: Partial<User>) => void;
  setOnboardingStep: (step: number) => void;
  completeOnboarding: () => void;
}

// Mock authentication service
const mockAuth = {
  signUp: async (email: string, password: string, name: string): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if user already exists (mock)
    const existingUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    if (existingUsers.find((u: any) => u.email === email)) {
      throw new Error('User already exists');
    }
    
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      country: '',
      countryCode: '',
      countryFlag: '',
      nativeLanguages: [],
      learningLanguages: [],
      culturalInterests: [],
      bio: '',
      age: 0,
      online: true,
      joinedDate: new Date().toISOString(),
    };
    
    // Save to mock storage
    existingUsers.push(newUser);
    localStorage.setItem('mockUsers', JSON.stringify(existingUsers));
    
    return newUser;
  },
  
  signIn: async (email: string, password: string): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const existingUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    const user = existingUsers.find((u: any) => u.email === email);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Mock password validation (in real app, this would be handled securely)
    if (password.length < 6) {
      throw new Error('Invalid password');
    }
    
    return user;
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      onboardingStep: 1,
      onboardingCompleted: false,
      
      signUp: async (email, password, name) => {
        set({ isLoading: true });
        try {
          const user = await mockAuth.signUp(email, password, name);
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false,
            onboardingStep: 2,
            onboardingCompleted: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      signIn: async (email, password) => {
        set({ isLoading: true });
        try {
          const user = await mockAuth.signIn(email, password);
          const existingUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
          const fullUser = existingUsers.find((u: any) => u.email === email);
          
          set({ 
            user: fullUser || user, 
            isAuthenticated: true, 
            isLoading: false,
            onboardingCompleted: fullUser?.onboardingCompleted || false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      signOut: () => {
        set({ 
          user: null, 
          isAuthenticated: false,
          onboardingStep: 1,
          onboardingCompleted: false
        });
      },
      
      updateProfile: (updates) => {
        const { user } = get();
        if (user) {
          const updatedUser = { ...user, ...updates };
          set({ user: updatedUser });
          
          // Update in mock storage
          const existingUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
          const userIndex = existingUsers.findIndex((u: any) => u.id === user.id);
          if (userIndex !== -1) {
            existingUsers[userIndex] = updatedUser;
            localStorage.setItem('mockUsers', JSON.stringify(existingUsers));
          }
        }
      },
      
      setOnboardingStep: (step) => {
        set({ onboardingStep: step });
      },
      
      completeOnboarding: () => {
        const { user } = get();
        if (user) {
          const updatedUser = { ...user, onboardingCompleted: true };
          
          // Update in mock storage
          const existingUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
          const userIndex = existingUsers.findIndex((u: any) => u.id === user.id);
          if (userIndex !== -1) {
            existingUsers[userIndex] = updatedUser;
            localStorage.setItem('mockUsers', JSON.stringify(existingUsers));
          }
        }
        set({ onboardingCompleted: true, onboardingStep: 1 });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        onboardingStep: state.onboardingStep,
        onboardingCompleted: state.onboardingCompleted,
      }),
    }
  )
);