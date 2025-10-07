import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

interface PostCommentState {
  comments: { [postId: string]: Comment[] };
  commentCounts: { [postId: string]: number };
  isLoading: boolean;
  
  // Actions
  addComment: (postId: string, content: string, parentCommentId?: string) => Promise<boolean>;
  loadComments: (postId: string) => Promise<void>;
  getCommentCount: (postId: string) => Promise<number>;
  loadMultiplePostComments: (postIds: string[]) => Promise<void>;
  deleteComment: (commentId: string, postId: string) => Promise<boolean>;
  editComment: (commentId: string, postId: string, newContent: string) => Promise<boolean>;
}

export const usePostCommentStore = create<PostCommentState>((set, get) => ({
  comments: {},
  commentCounts: {},
  isLoading: false,

  addComment: async (postId: string, content: string, parentCommentId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // First insert the comment
      const { data: commentData, error } = await (supabase as any)
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim(),
          parent_comment_id: parentCommentId || null
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        return false;
      }

      // Then get the profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single();

      // Combine the data
      const data = {
        ...commentData,
        profiles: profileData
      };

      // Update local state
      set(state => {
        const existingComments = state.comments[postId] || [];
        return {
          comments: {
            ...state.comments,
            [postId]: [data, ...existingComments]
          },
          commentCounts: {
            ...state.commentCounts,
            [postId]: (state.commentCounts[postId] || 0) + 1
          }
        };
      });

      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      return false;
    }
  },

  loadComments: async (postId: string) => {
    try {
      set({ isLoading: true });

      // First get the comments
      const { data: commentsData, error } = await (supabase as any)
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading comments:', error);
        set({ isLoading: false });
        return;
      }

      // Then get profile data for each unique user
      const userIds = [...new Set(commentsData?.map((comment: any) => comment.user_id as string) || [])] as string[];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds);

      // Create a map of profiles by user_id
      const profilesMap = (profilesData || []).reduce((acc: any, profile: any) => {
        acc[profile.id] = profile;
        return acc;
      }, {});

      // Combine comments with profile data
      const commentsWithProfiles = (commentsData || []).map((comment: any) => ({
        ...comment,
        profiles: profilesMap[comment.user_id] || null
      }));

      // Update local state
      set(state => ({
        comments: {
          ...state.comments,
          [postId]: commentsWithProfiles
        },
        commentCounts: {
          ...state.commentCounts,
          [postId]: commentsWithProfiles.length
        },
        isLoading: false
      }));
    } catch (error) {
      console.error('Error loading comments:', error);
      set({ isLoading: false });
    }
  },

  getCommentCount: async (postId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .rpc('get_post_comment_count', {
          post_uuid: postId
        });

      if (error) {
        console.error('Error getting comment count:', error);
        return 0;
      }

      const count = data || 0;
      
      // Update local state
      set(state => ({
        commentCounts: {
          ...state.commentCounts,
          [postId]: count
        }
      }));

      return count;
    } catch (error) {
      console.error('Error getting comment count:', error);
      return 0;
    }
  },

  loadMultiplePostComments: async (postIds: string[]) => {
    try {
      set({ isLoading: true });
      
      // Load comment counts for all posts in parallel
      await Promise.all(
        postIds.map(postId => get().getCommentCount(postId))
      );
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Error loading multiple post comments:', error);
      set({ isLoading: false });
    }
  },

  deleteComment: async (commentId: string, postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await (supabase as any)
        .from('post_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting comment:', error);
        return false;
      }

      // Update local state
      set(state => {
        const existingComments = state.comments[postId] || [];
        const updatedComments = existingComments.filter(comment => comment.id !== commentId);
        
        return {
          comments: {
            ...state.comments,
            [postId]: updatedComments
          },
          commentCounts: {
            ...state.commentCounts,
            [postId]: Math.max(0, (state.commentCounts[postId] || 0) - 1)
          }
        };
      });

      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  },

  editComment: async (commentId: string, postId: string, newContent: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await (supabase as any)
        .from('post_comments')
        .update({
          content: newContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error editing comment:', error);
        return false;
      }

      // Update local state
      set(state => {
        const existingComments = state.comments[postId] || [];
        const updateComment = (comments: Comment[]): Comment[] => {
          return comments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                content: newContent.trim(),
                updated_at: new Date().toISOString()
              };
            }
            // Also check replies
            if (comment.replies) {
              return {
                ...comment,
                replies: updateComment(comment.replies)
              };
            }
            return comment;
          });
        };

        return {
          comments: {
            ...state.comments,
            [postId]: updateComment(existingComments)
          }
        };
      });

      return true;
    } catch (error) {
      console.error('Error editing comment:', error);
      return false;
    }
  }
}));
