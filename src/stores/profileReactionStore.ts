import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface ProfileReactionState {
  reactions: { [profileId: string]: number };
  userReactions: { [profileId: string]: boolean };
  isLoading: boolean;
  
  // Actions
  toggleReaction: (profileId: string) => Promise<boolean>;
  getReactionCount: (profileId: string) => Promise<number>;
  hasUserReacted: (profileId: string) => Promise<boolean>;
  loadReactionData: (profileId: string) => Promise<void>;
}

export const useProfileReactionStore = create<ProfileReactionState>((set, get) => ({
  reactions: {},
  userReactions: {},
  isLoading: false,

  toggleReaction: async (profileId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check if user has already reacted
      const hasReacted = get().userReactions[profileId] || false;

      if (hasReacted) {
        // Remove reaction
        const { error } = await (supabase as any)
          .from('profile_reactions')
          .delete()
          .eq('profile_id', profileId)
          .eq('reactor_id', user.id)
          .eq('reaction_type', 'heart');

        if (error) {
          console.error('Error removing reaction:', error);
          return false;
        }

        // Update local state
        set(state => ({
          reactions: {
            ...state.reactions,
            [profileId]: Math.max(0, (state.reactions[profileId] || 0) - 1)
          },
          userReactions: {
            ...state.userReactions,
            [profileId]: false
          }
        }));
      } else {
        // Add reaction
        const { error } = await (supabase as any)
          .from('profile_reactions')
          .insert({
            profile_id: profileId,
            reactor_id: user.id,
            reaction_type: 'heart'
          });

        if (error) {
          console.error('Error adding reaction:', error);
          return false;
        }

        // Update local state
        set(state => ({
          reactions: {
            ...state.reactions,
            [profileId]: (state.reactions[profileId] || 0) + 1
          },
          userReactions: {
            ...state.userReactions,
            [profileId]: true
          }
        }));
      }

      return true;
    } catch (error) {
      console.error('Error toggling reaction:', error);
      return false;
    }
  },

  getReactionCount: async (profileId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .rpc('get_profile_reaction_count', {
          profile_user_id: profileId,
          reaction_type_param: 'heart'
        });

      if (error) {
        console.error('Error getting reaction count:', error);
        return 0;
      }

      const count = data || 0;
      
      // Update local state
      set(state => ({
        reactions: {
          ...state.reactions,
          [profileId]: count
        }
      }));

      return count;
    } catch (error) {
      console.error('Error getting reaction count:', error);
      return 0;
    }
  },

  hasUserReacted: async (profileId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await (supabase as any)
        .rpc('has_user_reacted_to_profile', {
          profile_user_id: profileId,
          reactor_user_id: user.id,
          reaction_type_param: 'heart'
        });

      if (error) {
        console.error('Error checking user reaction:', error);
        return false;
      }

      const hasReacted = data || false;
      
      // Update local state
      set(state => ({
        userReactions: {
          ...state.userReactions,
          [profileId]: hasReacted
        }
      }));

      return hasReacted;
    } catch (error) {
      console.error('Error checking user reaction:', error);
      return false;
    }
  },

  loadReactionData: async (profileId: string) => {
    try {
      set({ isLoading: true });
      
      // Load both count and user reaction status
      await Promise.all([
        get().getReactionCount(profileId),
        get().hasUserReacted(profileId)
      ]);
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Error loading reaction data:', error);
      set({ isLoading: false });
    }
  }
}));
