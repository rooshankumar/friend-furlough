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

// Mock data
const mockPosts: Post[] = [
  {
    id: '1',
    authorId: 'maria-santos',
    content: 'Just celebrated Festa Junina here in Brazil! 🎉 This traditional festival is so special to our culture - we have amazing food like pamonha and quentão, beautiful quadrilha dancing, and colorful decorations everywhere. The music fills the streets and everyone comes together to celebrate our rural heritage. Who wants to learn more about Brazilian festivals? I\'d love to share recipes and teach some dance moves! 💃🇧🇷',
    images: ['festa1.jpg', 'festa2.jpg', 'festa3.jpg'],
    type: 'cultural-moment',
    culturalTags: ['festivals', 'traditions', 'music', 'food', 'brazil'],
    languageTags: ['portuguese', 'english'],
    location: 'São Paulo, Brazil',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    reactions: [
      { userId: 'yuki-tanaka', type: 'love', timestamp: new Date().toISOString() },
      { userId: 'ahmed-hassan', type: 'learn', timestamp: new Date().toISOString() },
      { userId: 'user1', type: 'appreciate', timestamp: new Date().toISOString() }
    ],
    comments: [
      {
        id: 'c1',
        postId: '1',
        authorId: 'yuki-tanaka',
        content: 'This looks absolutely wonderful! The colors and energy remind me of our Japanese summer festivals. I\'d love to learn about the traditional foods - could you share a pamonha recipe? 🥰',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        reactions: [
          { userId: 'maria-santos', type: 'love', timestamp: new Date().toISOString() }
        ]
      },
      {
        id: 'c2',
        postId: '1',
        authorId: 'ahmed-hassan',
        content: 'Beautiful celebration! In Egypt, we have similar community gatherings during religious festivals. The sense of unity and joy looks universal across cultures. Thank you for sharing! 🌍',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        reactions: []
      }
    ],
    shareCount: 12,
    savedBy: ['yuki-tanaka', 'user1']
  },
  {
    id: '2',
    authorId: 'yuki-tanaka',
    content: '茶道 (Sadō) - The Way of Tea 🍵\n\nToday I practiced the Japanese tea ceremony with my grandmother. Every movement has meaning, every gesture shows respect. It\'s not just about drinking tea - it\'s about mindfulness, harmony, and connecting with others through shared silence and beauty.\n\nWa (harmony), Kei (respect), Sei (purity), Jaku (tranquility) - these are the four principles that guide us. In our fast world, this ancient practice reminds us to slow down and find peace.\n\nI\'d love to teach anyone interested in Japanese culture! What meditative practices do you have in your culture? 🧘‍♀️',
    images: ['tea1.jpg', 'tea2.jpg'],
    type: 'cultural-moment',
    culturalTags: ['tea-ceremony', 'meditation', 'traditions', 'japan', 'mindfulness'],
    languageTags: ['japanese', 'english'],
    location: 'Kyoto, Japan',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    reactions: [
      { userId: 'maria-santos', type: 'learn', timestamp: new Date().toISOString() },
      { userId: 'user1', type: 'appreciate', timestamp: new Date().toISOString() },
      { userId: 'ahmed-hassan', type: 'support', timestamp: new Date().toISOString() }
    ],
    comments: [
      {
        id: 'c3',
        postId: '2',
        authorId: 'maria-santos',
        content: 'This is so beautiful! In Brazil, we have our own way of connecting through coffee culture. The way you describe mindfulness in tea ceremony sounds similar to how we gather for cafezinho - it\'s about the moment, the connection, not just the drink. 🇧🇷☕',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        reactions: []
      }
    ],
    shareCount: 8,
    savedBy: ['user1', 'maria-santos']
  },
  {
    id: '3',
    authorId: 'user1',
    content: 'Language learning milestone! 🎉📚\n\nAfter 6 months of practicing Spanish with my amazing language partner Maria, I finally had my first complete conversation in Spanish at a local Mexican restaurant! The server was so patient and encouraging.\n\nKey lessons learned:\n• Don\'t be afraid to make mistakes - people appreciate the effort!\n• Cultural context is just as important as grammar\n• Real conversations are different from textbook exercises\n• Food vocabulary is essential 😄🌮\n\nTo everyone learning a new language: ¡Sí se puede! You can do it! What\'s your biggest language learning challenge?',
    type: 'language-progress',
    culturalTags: ['language-learning', 'spanish', 'progress', 'encouragement'],
    languageTags: ['english', 'spanish'],
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    reactions: [
      { userId: 'maria-santos', type: 'support', timestamp: new Date().toISOString() },
      { userId: 'yuki-tanaka', type: 'love', timestamp: new Date().toISOString() }
    ],
    comments: [
      {
        id: 'c4',
        postId: '3',
        authorId: 'maria-santos',
        content: '¡Estoy tan orgullosa! I\'m so proud of your progress! 🥺❤️ You\'ve worked so hard and it shows. Your pronunciation has improved so much since we started. Keep going, amigo!',
        timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
        reactions: [
          { userId: 'user1', type: 'love', timestamp: new Date().toISOString() }
        ]
      }
    ],
    shareCount: 5,
    savedBy: ['yuki-tanaka']
  },
  {
    id: '4',
    authorId: 'ahmed-hassan',
    content: 'Ramadan Kareem from Cairo! 🌙✨\n\nThis month is about so much more than fasting - it\'s about community, reflection, and empathy. Every evening, families and neighbors gather for Iftar, breaking our fast together with dates and water, followed by amazing traditional dishes.\n\nWhat I love most is how the entire city changes. The streets come alive at night, people are more generous and kind, and there\'s this beautiful sense of unity. Even non-Muslims often join us for Iftar to learn about our culture.\n\nFood brings us together: Fattah, Mahshi, Kunafa... I\'d love to share recipes with anyone interested! What traditions in your culture emphasize community and togetherness? 🤲🍽️',
    images: ['iftar1.jpg', 'iftar2.jpg', 'cairo.jpg'],
    type: 'cultural-moment',
    culturalTags: ['ramadan', 'community', 'food', 'traditions', 'egypt', 'family'],
    languageTags: ['arabic', 'english'],
    location: 'Cairo, Egypt',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    reactions: [
      { userId: 'maria-santos', type: 'learn', timestamp: new Date().toISOString() },
      { userId: 'yuki-tanaka', type: 'appreciate', timestamp: new Date().toISOString() },
      { userId: 'user1', type: 'love', timestamp: new Date().toISOString() }
    ],
    comments: [],
    shareCount: 15,
    savedBy: ['maria-santos', 'yuki-tanaka', 'user1']
  }
];

export const useCommunityStore = create<CommunityState>()(
  persist(
    (set, get) => ({
      posts: [],
      loading: false,
      
      loadPosts: () => {
        set({ loading: true });
        // Simulate API call
        setTimeout(() => {
          set({ posts: mockPosts, loading: false });
        }, 800);
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