import { create } from 'zustand';
import { User } from '@/types';
import { fetchProfiles } from '@/integrations/supabase/fetchProfiles';

interface ExploreFilters {
  countries: string[];
  nativeLanguages: string[];
  learningLanguages: string[];
  culturalInterests: string[];
  ageRange: [number, number];
  onlineOnly: boolean;
  lookingFor: string[];
}

interface ExploreState {
  users: User[];
  filteredUsers: User[];
  filters: ExploreFilters;
  searchTerm: string;
  isLoading: boolean;
  suggestedMatches: User[];
  
  // Actions
  loadUsers: () => Promise<void>;
  setFilters: (filters: Partial<ExploreFilters>) => void;
  setSearchTerm: (term: string) => void;
  applyFilters: () => void;
  getSuggestedMatches: (currentUserId: string) => User[];
  clearFilters: () => void;
}

const defaultFilters: ExploreFilters = {
  countries: [],
  nativeLanguages: [],
  learningLanguages: [],
  culturalInterests: [],
  ageRange: [18, 65],
  onlineOnly: false,
  lookingFor: [],
};

export const useExploreStore = create<ExploreState>((set, get) => ({
  users: [],
  filteredUsers: [],
  filters: defaultFilters,
  searchTerm: '',
  isLoading: false,
  suggestedMatches: [],
  
  loadUsers: async () => {
    set({ isLoading: true });
    try {
      const users = await fetchProfiles();
      set({
        users,
        filteredUsers: users,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
      // Optionally handle error (e.g., set error state)
      console.error('Failed to load users:', error);
    }
  },
  
  setFilters: (newFilters) => {
    const { filters } = get();
    const updatedFilters = { ...filters, ...newFilters };
    set({ filters: updatedFilters });
    get().applyFilters();
  },
  
  setSearchTerm: (term) => {
    set({ searchTerm: term });
    get().applyFilters();
  },
  
  applyFilters: () => {
    const { users, filters, searchTerm } = get();
    
    let filtered = users.filter(user => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          user.name.toLowerCase().includes(searchLower) ||
          user.country.toLowerCase().includes(searchLower) ||
          user.city?.toLowerCase().includes(searchLower) ||
          user.culturalInterests.some(interest => 
            interest.toLowerCase().includes(searchLower)
          ) ||
          user.nativeLanguages.some(lang => 
            lang.toLowerCase().includes(searchLower)
          ) ||
          user.learningLanguages.some(lang => 
            lang.toLowerCase().includes(searchLower)
          );
        
        if (!matchesSearch) return false;
      }
      
      // Country filter
      if (filters.countries.length > 0) {
        if (!filters.countries.includes(user.countryCode)) return false;
      }
      
      // Native languages filter
      if (filters.nativeLanguages.length > 0) {
        const hasMatchingNative = filters.nativeLanguages.some(lang =>
          user.nativeLanguages.includes(lang)
        );
        if (!hasMatchingNative) return false;
      }
      
      // Learning languages filter
      if (filters.learningLanguages.length > 0) {
        const hasMatchingLearning = filters.learningLanguages.some(lang =>
          user.learningLanguages.includes(lang)
        );
        if (!hasMatchingLearning) return false;
      }
      
      // Cultural interests filter
      if (filters.culturalInterests.length > 0) {
        const hasMatchingInterest = filters.culturalInterests.some(interest =>
          user.culturalInterests.includes(interest)
        );
        if (!hasMatchingInterest) return false;
      }
      
      // Age range filter
      if (user.age < filters.ageRange[0] || user.age > filters.ageRange[1]) {
        return false;
      }
      
      // Online only filter
      if (filters.onlineOnly && !user.online) {
        return false;
      }
      
      // Looking for filter
      if (filters.lookingFor.length > 0) {
        const hasMatchingGoal = filters.lookingFor.some(goal =>
          user.lookingFor?.includes(goal)
        );
        if (!hasMatchingGoal) return false;
      }
      
      return true;
    });
    
    set({ filteredUsers: filtered });
  },
  
  getSuggestedMatches: (currentUserId) => {
    const { users } = get();
    const currentUser = users.find(u => u.id === currentUserId);
    
    if (!currentUser) return [];
    
    // Simple matching algorithm based on language exchange potential
    const matches = users
      .filter(user => user.id !== currentUserId)
      .map(user => {
        let score = 0;
        
        // Language exchange potential (high priority)
        const canTeach = currentUser.nativeLanguages.some(lang =>
          user.learningLanguages.includes(lang)
        );
        const canLearn = currentUser.learningLanguages.some(lang =>
          user.nativeLanguages.includes(lang)
        );
        
        if (canTeach && canLearn) score += 10; // Perfect language exchange
        else if (canTeach || canLearn) score += 5; // One-way language help
        
        // Shared cultural interests
        const sharedInterests = currentUser.culturalInterests.filter(interest =>
          user.culturalInterests.includes(interest)
        );
        score += sharedInterests.length * 2;
        
        // Different countries (for cultural diversity)
        if (currentUser.countryCode !== user.countryCode) score += 3;
        
        // Online status
        if (user.online) score += 1;
        
        return { user, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(match => match.user);
    
    set({ suggestedMatches: matches });
    return matches;
  },
  
  clearFilters: () => {
    set({ 
      filters: defaultFilters,
      searchTerm: ''
    });
    get().applyFilters();
  }
}));