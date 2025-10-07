import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Post, Comment, PostReaction } from '@/types';

interface CommunityState {
  posts: Post[];
  loading: boolean;
  
  // Actions
  loadPosts: () => void;
  createPost: (post: Omit<Post, 'id' | 'timestamp' | 'reactions' | 'comments' | 'shareCount' | 'savedBy'>) => Promise<void>;
  addComment: (postId: string, comment: Omit<Comment, 'id' | 'postId' | 'timestamp' | 'replies' | 'reactions'>) => Promise<void>;
  addReaction: (postId: string, reaction: Omit<PostReaction, 'timestamp'>) => Promise<void>;
  sharePost: (postId: string) => void;
  savePost: (postId: string, userId: string) => void;
}


export const useCommunityStore = create<CommunityState>()(
  persist(
    (set, get) => ({
      posts: [],
      loading: false,

      loadPosts: async () => {
        set({ loading: true });
        try {
          const { fetchCommunityPosts } = await import('@/integrations/supabase/fetchCommunityPosts');
          const communityPosts = await fetchCommunityPosts();
          // Transform community_posts format to Post type
          // Note: community_posts is simpler than the full Post type
          const posts = communityPosts.map((cp: any) => ({
            id: cp.id,
            authorId: cp.user_id,
            content: cp.content,
            images: cp.image_url ? [cp.image_url] : [],
            type: 'cultural-moment' as const,
            culturalTags: [],
            languageTags: [],
            timestamp: cp.created_at,
            reactions: [],
            comments: [],
            shareCount: 0,
            savedBy: [],
          }));
          set({ posts, loading: false });
        } catch (e) {
          console.error('Error loading community posts:', e);
          set({ posts: [], loading: false });
        }
      },
      
      createPost: async (postData) => {
        const newPost: Post = {
          ...postData,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          reactions: [],
          comments: [],
          shareCount: 0,
          savedBy: []
        };
        
        const currentPosts = get().posts;
        set({ posts: [newPost, ...currentPosts] });
      },
      
      addComment: async (postId, commentData) => {
        const newComment: Comment = {
          ...commentData,
          id: Date.now().toString(),
          postId,
          timestamp: new Date().toISOString(),
          reactions: []
        };
        
        const posts = get().posts;
        const updatedPosts = posts.map(post =>
          post.id === postId
            ? { ...post, comments: [...post.comments, newComment] }
            : post
        );
        
        set({ posts: updatedPosts });
      },
      
      addReaction: async (postId, reactionData) => {
        const newReaction: PostReaction = {
          ...reactionData,
          timestamp: new Date().toISOString()
        };
        
        const posts = get().posts;
        const updatedPosts = posts.map(post => {
          if (post.id === postId) {
            // Remove existing reaction from same user if any
            const filteredReactions = post.reactions.filter(r => r.userId !== reactionData.userId);
            return { ...post, reactions: [...filteredReactions, newReaction] };
          }
          return post;
        });
        
        set({ posts: updatedPosts });
      },
      
      sharePost: (postId) => {
        const posts = get().posts;
        const updatedPosts = posts.map(post =>
          post.id === postId
            ? { ...post, shareCount: post.shareCount + 1 }
            : post
        );
        
        set({ posts: updatedPosts });
      },
      
      savePost: (postId, userId) => {
        const posts = get().posts;
        const updatedPosts = posts.map(post => {
          if (post.id === postId) {
            const alreadySaved = post.savedBy.includes(userId);
            return {
              ...post,
              savedBy: alreadySaved
                ? post.savedBy.filter(id => id !== userId)
                : [...post.savedBy, userId]
            };
          }
          return post;
        });
        
        set({ posts: updatedPosts });
      }
    }),
    {
      name: 'community-storage',
      partialize: (state) => ({
        posts: state.posts
      })
    }
  )
);