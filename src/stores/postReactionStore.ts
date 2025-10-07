import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface PostReactionState {
  reactions: { [postId: string]: number };
  userReactions: { [postId: string]: boolean };
  isLoading: boolean;
  
  // Actions
  toggleReaction: (postId: string, reactionType?: string) => Promise<boolean>;
  getReactionCount: (postId: string, reactionType?: string) => Promise<number>;
  hasUserReacted: (postId: string, reactionType?: string) => Promise<boolean>;
  loadReactionData: (postId: string, reactionType?: string) => Promise<void>;
  loadMultiplePostReactions: (postIds: string[], reactionType?: string) => Promise<void>;
}

export const usePostReactionStore = create<PostReactionState>((set, get) => ({
  reactions: {},
  userReactions: {},
  isLoading: false,

  toggleReaction: async (postId: string, reactionType: string = 'like') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check if user has already reacted
      const hasReacted = get().userReactions[`${postId}_${reactionType}`] || false;

      if (hasReacted) {
        // Remove reaction
        const { error } = await (supabase as any)
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .eq('reaction_type', reactionType);

        if (error) {
          console.error('Error removing reaction:', error);
          return false;
        }

        // Update local state
        set(state => ({
          reactions: {
            ...state.reactions,
            [`${postId}_${reactionType}`]: Math.max(0, (state.reactions[`${postId}_${reactionType}`] || 0) - 1)
          },
          userReactions: {
            ...state.userReactions,
            [`${postId}_${reactionType}`]: false
          }
        }));
      } else {
        // Add reaction
        const { error } = await (supabase as any)
          .from('post_reactions')
          .insert({
            post_id: postId,
            user_id: user.id,
            reaction_type: reactionType
          });

        if (error) {
          console.error('Error adding reaction:', error);
          return false;
        }

        // Update local state
        set(state => ({
          reactions: {
            ...state.reactions,
            [`${postId}_${reactionType}`]: (state.reactions[`${postId}_${reactionType}`] || 0) + 1
          },
          userReactions: {
            ...state.userReactions,
            [`${postId}_${reactionType}`]: true
          }
        }));
      }

      return true;
    } catch (error) {
      console.error('Error toggling reaction:', error);
      return false;
    }
  },

  getReactionCount: async (postId: string, reactionType: string = 'like') => {
    try {
      const { data, error } = await (supabase as any)
        .rpc('get_post_reaction_count', {
          post_uuid: postId,
          reaction_type_param: reactionType
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
          [`${postId}_${reactionType}`]: count
        }
      }));

      return count;
    } catch (error) {
      console.error('Error getting reaction count:', error);
      return 0;
    }
  },

  hasUserReacted: async (postId: string, reactionType: string = 'like') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await (supabase as any)
        .rpc('has_user_reacted_to_post', {
          post_uuid: postId,
          user_uuid: user.id,
          reaction_type_param: reactionType
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
          [`${postId}_${reactionType}`]: hasReacted
        }
      }));

      return hasReacted;
    } catch (error) {
      console.error('Error checking user reaction:', error);
      return false;
    }
  },

  loadReactionData: async (postId: string, reactionType: string = 'like') => {
    try {
      set({ isLoading: true });
      
      // Load both count and user reaction status
      await Promise.all([
        get().getReactionCount(postId, reactionType),
        get().hasUserReacted(postId, reactionType)
      ]);
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Error loading reaction data:', error);
      set({ isLoading: false });
    }
  },

  loadMultiplePostReactions: async (postIds: string[], reactionType: string = 'like') => {
    try {
      set({ isLoading: true });
      
      // Load reaction data for all posts in parallel
      await Promise.all(
        postIds.map(postId => get().loadReactionData(postId, reactionType))
      );
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Error loading multiple post reactions:', error);
      set({ isLoading: false });
    }
  }
}));
