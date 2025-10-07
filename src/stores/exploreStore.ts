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
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      const users = await fetchProfiles();
      
      // Filter out current user
      const filteredUsers = user ? users.filter(u => u.id !== user.id) : users;
      
      set({
        users: filteredUsers,
        filteredUsers: filteredUsers,
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
    
    if (!currentUser) {
      console.log('Current user not found for matching');
      return [];
    }
    
    console.log('Generating matches for user:', currentUser.name);
    console.log('Current user native languages:', currentUser.nativeLanguages);
    console.log('Current user learning languages:', currentUser.learningLanguages);
    console.log('Current user interests:', currentUser.culturalInterests);
    
    // Enhanced matching algorithm based on language exchange and cultural fit
    const matches = users
      .filter(user => user.id !== currentUserId)
      .map(user => {
        let score = 0;
        const matchReasons: string[] = [];
        
        // Language exchange potential (highest priority)
        const canTeach = currentUser.nativeLanguages.filter(lang =>
          user.learningLanguages.includes(lang)
        );
        const canLearn = currentUser.learningLanguages.filter(lang =>
          user.nativeLanguages.includes(lang)
        );
        
        if (canTeach.length > 0 && canLearn.length > 0) {
          score += 15; // Perfect bidirectional exchange
          matchReasons.push(`Perfect match: You can teach ${canTeach.join(', ')} and learn ${canLearn.join(', ')}`);
        } else if (canTeach.length > 0) {
          score += 7; // Can help them
          matchReasons.push(`You can help with ${canTeach.join(', ')}`);
        } else if (canLearn.length > 0) {
          score += 7; // They can help you
          matchReasons.push(`They can help you with ${canLearn.join(', ')}`);
        }
        
        // Bonus for multiple language matches
        score += (canTeach.length + canLearn.length) * 2;
        
        // Shared cultural interests
        const sharedInterests = currentUser.culturalInterests.filter(interest =>
          user.culturalInterests.includes(interest)
        );
        
        if (sharedInterests.length >= 3) {
          score += 8;
          matchReasons.push(`${sharedInterests.length} shared interests`);
        } else if (sharedInterests.length > 0) {
          score += sharedInterests.length * 2;
          matchReasons.push(`Shared interest in ${sharedInterests[0]}`);
        }
        
        // Cultural diversity (different countries encouraged)
        if (currentUser.countryCode !== user.countryCode && user.countryCode) {
          score += 4;
          matchReasons.push(`Cultural exchange with ${user.country}`);
        } else if (currentUser.countryCode === user.countryCode) {
          // Same country gets small bonus for local connections
          score += 1;
        }
        
        // Age proximity (within 10 years)
        if (currentUser.age && user.age) {
          const ageDiff = Math.abs(currentUser.age - user.age);
          if (ageDiff <= 5) {
            score += 3;
          } else if (ageDiff <= 10) {
            score += 1;
          }
        }
        
        // Online status
        if (user.online) {
          score += 2;
          matchReasons.push('Currently online');
        }
        
        // Profile completeness bonus
        if (user.bio && user.bio.length > 20) {
          score += 1;
        }
        
        return { user, score, matchReasons };
      })
      .filter(match => match.score > 0) // Only include users with some match
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) // Get top 10 matches
      .map(match => {
        console.log(`Match: ${match.user.name} - Score: ${match.score} - Reasons:`, match.matchReasons);
        return match.user;
      });
    
    console.log('Generated', matches.length, 'suggested matches');
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