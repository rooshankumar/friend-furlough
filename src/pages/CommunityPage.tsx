import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { usePostReactionStore } from '@/stores/postReactionStore';
import { usePostCommentStore } from '@/stores/postCommentStore';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/PullToRefresh';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import UserAvatar from '@/components/UserAvatar';
import { Heart, MessageCircle, Upload, Globe, Trash2, MoreHorizontal, Loader2, RefreshCw, TrendingUp, Clock, Users, Send, ChevronDown, ChevronUp, Hash, Plus, X, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { uploadPostImage } from '@/lib/storage';
import { mobileUploadHelper, getMobileErrorMessage } from '@/lib/mobileUploadHelper';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { parseSupabaseError } from '@/lib/errorHandler';

interface Post {
  id: string;
  content: string;
  image_url?: string;
  created_at: string;
  user_id: string;
  profiles?: {
    name: string;
    avatar_url?: string;
    country_flag?: string;
  };
}

const CommunityPage = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { 
    toggleReaction, 
    reactions, 
    userReactions, 
    loadMultiplePostReactions 
  } = usePostReactionStore();
  const { 
    addComment, 
    loadComments, 
    comments, 
    commentCounts, 
    loadMultiplePostComments 
  } = usePostCommentStore();

  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showComments, setShowComments] = useState<{[key: string]: boolean}>({});
  const [newComment, setNewComment] = useState<{[key: string]: string}>({});
  const [replyingTo, setReplyingTo] = useState<{[key: string]: string | null}>({});
  const [replyText, setReplyText] = useState<{[key: string]: string}>({});
  const [activeFilter, setActiveFilter] = useState<'hot' | 'new' | 'friends'>('new');
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [activeFriends, setActiveFriends] = useState<any[]>([]);
  const [communityStats, setCommunityStats] = useState({ totalPosts: 0, activeToday: 0, members: 0 });
  const [trendingHashtags, setTrendingHashtags] = useState<{ tag: string; count: number }[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]); // Store all posts
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]); // Display filtered posts
  const [showCreatePost, setShowCreatePost] = useState(false); // Mobile create post modal
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const POSTS_PER_PAGE = 20;
  
  // Pull-to-refresh for posts
  const postsPullToRefresh = usePullToRefresh({
    onRefresh: async () => {
      await loadPosts(true);
      toast({ title: 'Posts refreshed' });
    },
    threshold: 80
  });

  // Optimized load posts with pagination
  const loadPosts = useCallback(async (force = false, loadMore = false) => {
    if (force) {
      setIsRefreshing(true);
      setAllPosts([]);
      setHasMore(true);
    }
    if (loadMore) setIsLoadingMore(true);
    
    try {
      const currentPosts = loadMore ? allPosts : [];
      const lastPost = currentPosts[currentPosts.length - 1];
      
      let query = supabase
        .from('community_posts' as any)
        .select(`
          *,
          profiles!community_posts_user_id_fkey (
            name,
            avatar_url,
            country_flag
          )
        `)
        .order('created_at', { ascending: false })
        .limit(POSTS_PER_PAGE + 1); // +1 to check if there are more
      
      // Cursor-based pagination
      if (loadMore && lastPost) {
        query = query.lt('created_at', lastPost.created_at);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      
      const postsData = (data as any) || [];
      
      // Check if there are more posts
      const hasMorePosts = postsData.length > POSTS_PER_PAGE;
      const displayPosts = hasMorePosts ? postsData.slice(0, POSTS_PER_PAGE) : postsData;
      setHasMore(hasMorePosts);
      
      // Append or replace posts
      const updatedPosts = loadMore ? [...currentPosts, ...displayPosts] : displayPosts;
      setAllPosts(updatedPosts);
      setPosts(updatedPosts);

      // Batch load reactions and comments
      if (postsData.length > 0) {
        const postIds = postsData.map((post: any) => post.id);
        await Promise.all([
          loadMultiplePostReactions(postIds, 'like'),
          loadMultiplePostComments(postIds)
        ]);
      }

      // Apply current filter
      applyFilter(activeFilter, postsData);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        title: "Failed to load posts",
        description: "Please try refreshing the page",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [loadMultiplePostReactions, loadMultiplePostComments, toast, activeFilter, allPosts, POSTS_PER_PAGE]);
  
  // Load more posts
  const loadMorePosts = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      loadPosts(false, true);
    }
  }, [isLoadingMore, hasMore, loadPosts]);

  useEffect(() => {
    loadPosts();
    loadSuggestedUsers();
    loadActiveFriends();
    loadCommunityStats();
    loadTrendingHashtags();
  }, [loadPosts]);

  // Apply filter when activeFilter changes
  useEffect(() => {
    applyFilter(activeFilter, allPosts);
  }, [activeFilter]);

  // Filter posts based on selected filter
  const applyFilter = async (filter: 'hot' | 'new' | 'friends', postsToFilter: Post[] = allPosts) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      let filtered: Post[] = [];

      switch (filter) {
        case 'hot':
          // Sort by engagement (likes + comments)
          filtered = [...postsToFilter].sort((a, b) => {
            const engagementA = (reactions[`${a.id}_like`] || 0) + (commentCounts[a.id] || 0);
            const engagementB = (reactions[`${b.id}_like`] || 0) + (commentCounts[b.id] || 0);
            return engagementB - engagementA;
          });
          break;

        case 'new':
          // Already sorted by created_at desc from query
          filtered = [...postsToFilter];
          break;

        case 'friends':
          // Get user's friends
          const { data: friendships } = await supabase
            .from('friendships')
            .select('user1_id, user2_id')
            .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`);

          const friendIds = friendships?.map(f => 
            f.user1_id === currentUser.id ? f.user2_id : f.user1_id
          ) || [];

          // Filter posts from friends only
          filtered = postsToFilter.filter(post => friendIds.includes(post.user_id));
          break;

        default:
          filtered = postsToFilter;
      }

      setPosts(filtered);
    } catch (error) {
      console.error('Error applying filter:', error);
      setPosts(postsToFilter);
    }
  };

  // Load suggested users (users not yet friends)
  const loadSuggestedUsers = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      // Get current user's friends
      const { data: friendships } = await supabase
        .from('friendships')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`);

      const friendIds = friendships?.map(f => 
        f.user1_id === currentUser.id ? f.user2_id : f.user1_id
      ) || [];

      // Get users who are not friends and not current user
      const { data: users } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, country_flag, language_goals')
        .not('id', 'in', `(${[currentUser.id, ...friendIds].join(',')})`)
        .limit(4);

      setSuggestedUsers(users || []);
    } catch (error) {
      console.error('Error loading suggested users:', error);
    }
  };

  // Load active friends (online friends)
  const loadActiveFriends = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      // Get current user's friends
      const { data: friendships } = await supabase
        .from('friendships')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`);

      const friendIds = friendships?.map(f => 
        f.user1_id === currentUser.id ? f.user2_id : f.user1_id
      ) || [];

      if (friendIds.length === 0) {
        setActiveFriends([]);
        return;
      }

      // Get online friends
      const { data: onlineFriends } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, online')
        .in('id', friendIds)
        .eq('online', true)
        .limit(5);

      setActiveFriends(onlineFriends || []);
    } catch (error) {
      console.error('Error loading active friends:', error);
    }
  };

  // Load community stats
  const loadCommunityStats = async () => {
    try {
      // Total posts count
      const { count: totalPosts } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true });

      // Active today (posts in last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const { count: activeToday } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());

      // Total members
      const { count: members } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      setCommunityStats({
        totalPosts: totalPosts || 0,
        activeToday: activeToday || 0,
        members: members || 0
      });
    } catch (error) {
      console.error('Error loading community stats:', error);
    }
  };

  // Load trending hashtags from posts
  const loadTrendingHashtags = async () => {
    try {
      const { data: posts } = await supabase
        .from('community_posts')
        .select('content')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!posts) return;

      // Extract all hashtags
      const hashtagCounts: { [key: string]: number } = {};
      posts.forEach(post => {
        const hashtags = extractHashtags(post.content);
        hashtags.forEach(tag => {
          const cleanTag = tag.substring(1); // Remove #
          hashtagCounts[cleanTag] = (hashtagCounts[cleanTag] || 0) + 1;
        });
      });

      // Sort by count and get top 5
      const trending = Object.entries(hashtagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setTrendingHashtags(trending);
    } catch (error) {
      console.error('Error loading trending hashtags:', error);
    }
  };

  // Handle add friend
  const handleAddFriend = async (userId: string) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: currentUser.id,
          receiver_id: userId,
          status: 'pending'
        });

      if (error) throw error;

      toast({ title: "Friend request sent!" });
      // Remove from suggested users
      setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error: any) {
      const errorResponse = parseSupabaseError(error);
      toast({ 
        title: "Failed to send request", 
        description: errorResponse.message,
        variant: "destructive" 
      });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    
    for (const file of files) {
      const validation = mobileUploadHelper.validateFile(file, {
        maxSizeMB: 10,
        allowedTypes: ['image/']
      });
      
      if (validation.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push(`${file.name}: ${validation.error}`);
      }
    }
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Some files couldn't be added",
        description: invalidFiles.join(', '),
        variant: "destructive",
      });
    }
    
    const filesToAdd = validFiles.slice(0, 4 - selectedImages.length);
    
    if (selectedImages.length + validFiles.length > 4) {
      toast({
        title: "Image limit",
        description: "Maximum 4 images per post",
        variant: "destructive",
      });
    }
    
    if (filesToAdd.length === 0) return;
    
    setSelectedImages([...selectedImages, ...filesToAdd]);
    
    filesToAdd.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Delete this post?')) return;

    try {
      const { error } = await supabase
        .from('community_posts' as any)
        .delete()
        .eq('id', postId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setPosts(prev => prev.filter(p => p.id !== postId));
      toast({
        title: "Post deleted",
        description: "Your post has been removed",
      });
    } catch (error: any) {
      const errorResponse = parseSupabaseError(error);
      toast({
        title: "Delete failed",
        description: errorResponse.message,
        variant: "destructive",
      });
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() && selectedImages.length === 0) {
      toast({
        title: "Content required",
        description: "Please add content or images",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a post",
        variant: "destructive",
      });
      return;
    }

    setIsPosting(true);
    try {
      let imageUrl = '';
      
      if (selectedImages.length > 0) {
        const result = await mobileUploadHelper.uploadWithRetry(
          (f) => uploadPostImage(f, user.id),
          selectedImages[0],
          { enableRetry: true }
        );
        
        if (!result.success) throw new Error(result.error);
        imageUrl = result.url!;
      }

      const { error } = await supabase
        .from('community_posts' as any)
        .insert({
          user_id: user.id,
          content: newPost,
          image_url: imageUrl || null,
        });

      if (error) throw error;

      toast({
        title: "Post created! 🎉",
        description: "Your post has been shared",
      });

      setNewPost('');
      setSelectedImages([]);
      setImagePreviews([]);
      loadPosts(true);
    } catch (error: any) {
      const errorResponse = parseSupabaseError(error);
      toast({
        title: "Failed to create post",
        description: errorResponse.message,
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    await toggleReaction(postId, 'like');
  };

  const handleToggleComments = async (postId: string) => {
    const isCurrentlyShown = showComments[postId];
    
    setShowComments(prev => ({
      ...prev,
      [postId]: !isCurrentlyShown
    }));

    if (!isCurrentlyShown && (!comments[postId] || comments[postId].length === 0)) {
      await loadComments(postId);
    }
  };

  const handleAddComment = async (postId: string) => {
    const commentText = newComment[postId]?.trim();
    if (!commentText) return;

    const success = await addComment(postId, commentText);
    if (success) {
      setNewComment(prev => ({ ...prev, [postId]: '' }));
      toast({ title: "Comment added!" });
    }
  };

  const handleAddReply = async (postId: string, parentCommentId: string) => {
    const replyContent = replyText[`${postId}_${parentCommentId}`]?.trim();
    if (!replyContent) return;

    const success = await addComment(postId, replyContent, parentCommentId);
    if (success) {
      setReplyText(prev => ({ ...prev, [`${postId}_${parentCommentId}`]: '' }));
      setReplyingTo(prev => ({ ...prev, [postId]: null }));
      toast({ title: "Reply added!" });
      // Reload comments to show nested structure
      await loadComments(postId);
    }
  };

  const handleReplyClick = (postId: string, commentId: string, userName: string) => {
    setReplyingTo(prev => ({ ...prev, [postId]: commentId }));
    setReplyText(prev => ({ ...prev, [`${postId}_${commentId}`]: `@${userName} ` }));
  };

  const handleCancelReply = (postId: string, commentId: string) => {
    setReplyingTo(prev => ({ ...prev, [postId]: null }));
    setReplyText(prev => ({ ...prev, [`${postId}_${commentId}`]: '' }));
  };

  // Extract hashtags from post content
  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#[\w]+/g;
    return text.match(hashtagRegex) || [];
  };

  // Render text with clickable hashtags
  const renderTextWithHashtags = (text: string) => {
    const parts = text.split(/(#[\w]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <span key={index} className="text-primary font-medium cursor-pointer hover:underline">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Organize comments into parent-child structure
  const organizeComments = (comments: any[]) => {
    const commentMap: { [key: string]: any } = {};
    const rootComments: any[] = [];

    // First pass: create a map of all comments
    comments.forEach(comment => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    // Second pass: organize into tree structure
    comments.forEach(comment => {
      if (comment.parent_comment_id && commentMap[comment.parent_comment_id]) {
        commentMap[comment.parent_comment_id].replies.push(commentMap[comment.id]);
      } else {
        rootComments.push(commentMap[comment.id]);
      }
    });

    return rootComments;
  };

  // Render a single comment with its replies
  const renderComment = (comment: any, postId: string, depth: number = 0) => {
    const isReplying = replyingTo[postId] === comment.id;
    const maxDepth = 3; // Limit nesting depth

    return (
      <div key={comment.id} className={depth > 0 ? 'ml-6 mt-2' : ''}>
        <div className="flex gap-2">
          <UserAvatar profile={comment.profiles} size="sm" className="shrink-0 w-7 h-7" />
          <div className="flex-1">
            <div className="bg-muted/50 rounded-lg p-2">
              <p className="text-xs font-medium">{comment.profiles?.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{comment.content}</p>
            </div>
            <div className="flex items-center gap-3 mt-1 ml-1">
              <button
                onClick={() => handleReplyClick(postId, comment.id, comment.profiles?.name)}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Reply
              </button>
              <span className="text-xs text-muted-foreground">
                {new Date(comment.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  hour: 'numeric'
                })}
              </span>
              {comment.replies && comment.replies.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </span>
              )}
            </div>

            {/* Reply Input */}
            {isReplying && (
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder={`Reply to ${comment.profiles?.name}...`}
                  value={replyText[`${postId}_${comment.id}`] || ''}
                  onChange={(e) => setReplyText(prev => ({ ...prev, [`${postId}_${comment.id}`]: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddReply(postId, comment.id)}
                  className="text-xs h-8 bg-background/60"
                  style={{ fontSize: '14px' }}
                  autoFocus
                />
                <Button size="sm" onClick={() => handleAddReply(postId, comment.id)} className="h-8 px-3">
                  <Send className="h-3 w-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => handleCancelReply(postId, comment.id)} 
                  className="h-8 px-2"
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && depth < maxDepth && (
              <div className="mt-2">
                {comment.replies.map((reply: any) => renderComment(reply, postId, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen md:ml-16 bg-gradient-to-br from-background via-background/95 to-background pb-16 md:pb-0">
        <div className="max-w-2xl mx-auto p-4">
          <Skeleton className="h-12 w-full rounded-xl mb-4" />
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 mb-3">
              <Skeleton className="h-32 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:ml-16 bg-gradient-to-br from-background via-background/95 to-background pb-16 md:pb-0">
      {/* Desktop: 3-Column Layout | Mobile: Single Column */}
      <div className="h-full flex">
        {/* Left Sidebar - Desktop Only */}
        <div className="hidden lg:block w-64 xl:w-80 border-r border-border/50 p-4 overflow-y-auto">
          <div className="sticky top-4 space-y-4">
            {/* Quick Stats - Real Data */}
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Community Stats
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Posts</span>
                  <span className="font-semibold">{communityStats.totalPosts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Today</span>
                  <span className="font-semibold">{communityStats.activeToday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Members</span>
                  <span className="font-semibold">
                    {communityStats.members >= 1000 
                      ? `${(communityStats.members / 1000).toFixed(1)}K` 
                      : communityStats.members}
                  </span>
                </div>
              </div>
            </Card>

            {/* Trending Hashtags - Real Data */}
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                Trending Topics
              </h3>
              <div className="space-y-2">
                {trendingHashtags.length > 0 ? (
                  trendingHashtags.map((item) => (
                    <button
                      key={item.tag}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        // TODO: Filter posts by hashtag
                        toast({ title: `Filtering by #${item.tag}` });
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-primary">#{item.tag}</span>
                        <span className="text-xs text-muted-foreground">{item.count}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No trending topics yet
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Center Feed - Responsive Width */}
        <div ref={postsPullToRefresh.containerRef} className="flex-1 min-w-0 overflow-y-auto relative">
          <PullToRefreshIndicator 
            pullDistance={postsPullToRefresh.pullDistance}
            isRefreshing={postsPullToRefresh.isRefreshing}
            threshold={80}
          />
          
          {/* Mobile Header with Filters */}
          <div className="lg:hidden sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50">
            <div className="p-3 pb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-bold">Community</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadPosts(true)}
                  disabled={isRefreshing}
                  className="h-8 px-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              {/* Filter Buttons - Mobile */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveFilter('hot')}
                  className={`h-9 text-xs rounded-lg transition-all ${
                    activeFilter === 'hot' 
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5 mr-1" />
                  Hot
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveFilter('new')}
                  className={`h-9 text-xs rounded-lg transition-all ${
                    activeFilter === 'new' 
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  New
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveFilter('friends')}
                  className={`h-9 text-xs rounded-lg transition-all ${
                    activeFilter === 'friends' 
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <Users className="h-3.5 w-3.5 mr-1" />
                  Friends
                </Button>
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold">Community</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadPosts(true)}
                  disabled={isRefreshing}
                  className="h-8 px-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              {/* Filter Chips - Desktop */}
              <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto">
                <Button
                  variant={activeFilter === 'hot' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter('hot')}
                  className="h-7 text-xs flex-shrink-0"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Hot
                </Button>
                <Button
                  variant={activeFilter === 'new' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter('new')}
                  className="h-7 text-xs flex-shrink-0"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  New
                </Button>
                <Button
                  variant={activeFilter === 'friends' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter('friends')}
                  className="h-7 text-xs flex-shrink-0"
                >
                  <Users className="h-3 w-3 mr-1" />
                  Friends
                </Button>
              </div>
            </div>
          </div>

          {/* Post Creation - Hidden on Mobile, Visible on Desktop */}
          <div className="hidden lg:block p-3">
            <Card className="p-3 bg-card border-border/50 shadow-sm">
              <div className="flex items-center gap-2">
                <UserAvatar user={user} size="sm" className="flex-shrink-0" />
                <Input
                  placeholder="What's on your mind?"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="bg-background/60 border-border/50 text-sm h-9"
                  style={{ fontSize: '16px' }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => document.getElementById('post-image')?.click()}
                  disabled={selectedImages.length >= 4}
                  className="h-9 w-9 p-0 flex-shrink-0"
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <input
                  id="post-image"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <Button
                  onClick={handleCreatePost}
                  disabled={isPosting}
                  size="sm"
                  className="h-9 px-3 flex-shrink-0"
                >
                  {isPosting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Post'}
                </Button>
              </div>
              
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="rounded-lg h-full w-full object-cover"
                        loading="lazy"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Compact Posts Feed - Mobile: No padding | Desktop: Normal padding */}
          <div className="lg:px-3 pb-3 space-y-2 lg:space-y-3">
          {posts.length === 0 ? (
            <Card className="p-8 text-center bg-card border-border/50">
              <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
              <p className="text-sm text-muted-foreground">
                Be the first to share something!
              </p>
            </Card>
          ) : (
            posts.map((post, index) => (
              <Card 
                key={post.id} 
                className="overflow-hidden hover:shadow-md transition-all bg-card border-border/50 animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="p-3">
                  {/* Compact Post Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="cursor-pointer shrink-0"
                      onClick={() => {
                        if (post.user_id) navigate(`/profile/${post.user_id}`);
                      }}
                    >
                      <UserAvatar 
                        profile={post.profiles}
                        size="sm"
                        className="w-9 h-9"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 
                            className="font-semibold text-sm cursor-pointer hover:text-primary transition-colors"
                            onClick={() => {
                              if (post.user_id) navigate(`/profile/${post.user_id}`);
                            }}
                          >
                            {post.profiles?.name || 'Anonymous'}
                          </h4>
                          {post.profiles?.country_flag && (
                            <span className="text-sm">{post.profiles.country_flag}</span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            • {new Date(post.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: 'numeric'
                            }).replace(',', ' •')}
                          </span>
                        </div>
                        {post.user_id === user?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleDeletePost(post.id)}
                                className="text-destructive focus:text-destructive text-xs"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Post Content with Hashtags */}
                  <p 
                    className="text-sm leading-relaxed mb-2 cursor-pointer"
                    onClick={() => navigate(`/post/${post.id}`)}
                  >
                    {renderTextWithHashtags(post.content)}
                  </p>

                  {/* Post Image - Fixed Height */}
                  {post.image_url && (
                    <div className="rounded-lg overflow-hidden mb-2 bg-muted">
                      <img
                        src={post.image_url}
                        alt="Post"
                        loading="lazy"
                        decoding="async"
                        className="w-full object-cover h-[300px] cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => navigate(`/post/${post.id}`)}
                      />
                    </div>
                  )}

                  {/* Compact Post Actions */}
                  <div className="flex items-center gap-1 pt-2 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 px-3 ${userReactions[`${post.id}_like`] ? 'text-red-500 hover:text-red-600' : 'hover:bg-red-500/10'}`}
                      onClick={() => handleLikePost(post.id)}
                    >
                      <Heart className={`h-3.5 w-3.5 mr-1 ${userReactions[`${post.id}_like`] ? 'fill-current' : ''}`} />
                      <span className="text-xs font-medium">{reactions[`${post.id}_like`] || 0}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 hover:bg-primary/10"
                      onClick={() => handleToggleComments(post.id)}
                    >
                      <MessageCircle className="h-3.5 w-3.5 mr-1" />
                      <span className="text-xs font-medium">{commentCounts[post.id] || 0}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 ml-auto"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Collapsible Comments Section with Replies */}
                  {showComments[post.id] && (
                    <div className="mt-3 space-y-2 pt-3 border-t border-border/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {commentCounts[post.id] || 0} Comment{commentCounts[post.id] !== 1 ? 's' : ''}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleToggleComments(post.id)}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* Render organized comments with nested replies */}
                      <div className="space-y-3">
                        {organizeComments(comments[post.id] || []).map((comment: any) => 
                          renderComment(comment, post.id, 0)
                        )}
                      </div>

                      {/* Add new comment */}
                      <div className="flex gap-2 mt-3 pt-2 border-t border-border/30">
                        <Input
                          placeholder="Add a comment..."
                          value={newComment[post.id] || ''}
                          onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                          className="text-xs h-8 bg-background/60"
                          style={{ fontSize: '14px' }}
                        />
                        <Button size="sm" onClick={() => handleAddComment(post.id)} className="h-8 px-3">
                          <Send className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Show Comments Button when collapsed */}
                  {!showComments[post.id] && commentCounts[post.id] > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 mt-2 text-xs text-muted-foreground hover:text-primary"
                      onClick={() => handleToggleComments(post.id)}
                    >
                      <ChevronDown className="h-3 w-3 mr-1" />
                      View {commentCounts[post.id]} comment{commentCounts[post.id] !== 1 ? 's' : ''}
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
          
          {/* Load More Button */}
          {hasMore && posts.length > 0 && (
            <div className="flex justify-center mt-6">
              <Button
                onClick={loadMorePosts}
                disabled={isLoadingMore}
                variant="outline"
                className="w-full max-w-md"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading more posts...
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Load More Posts
                  </>
                )}
              </Button>
            </div>
          )}
          
          {!hasMore && posts.length > 0 && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              You've reached the end! 🎉
            </p>
          )}
          </div>
        </div>

        {/* Right Sidebar - Desktop Only */}
        <div className="hidden xl:block w-80 border-l border-border/50 p-4 overflow-y-auto">
          <div className="sticky top-4 space-y-4">
            {/* Suggested Users - Real Data from Explore */}
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Suggested Friends
              </h3>
              <div className="space-y-3">
                {suggestedUsers.length > 0 ? (
                  suggestedUsers.map((suggestedUser) => (
                    <div key={suggestedUser.id} className="flex items-center gap-2">
                      <div 
                        className="cursor-pointer"
                        onClick={() => navigate(`/profile/${suggestedUser.id}`)}
                      >
                        <UserAvatar 
                          profile={suggestedUser}
                          className="w-10 h-10"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p 
                          className="text-sm font-medium truncate cursor-pointer hover:text-primary"
                          onClick={() => navigate(`/profile/${suggestedUser.id}`)}
                        >
                          {suggestedUser.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {suggestedUser.language_goals?.[0] || 'Language learner'}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-xs"
                        onClick={() => handleAddFriend(suggestedUser.id)}
                      >
                        Add
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No suggestions available
                  </p>
                )}
              </div>
            </Card>

            {/* Active Now - Real Online Friends */}
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Active Now
              </h3>
              <div className="space-y-2">
                {activeFriends.length > 0 ? (
                  activeFriends.map((friend) => (
                    <div 
                      key={friend.id} 
                      className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded p-1 transition-colors"
                      onClick={() => navigate(`/profile/${friend.id}`)}
                    >
                      <div className="relative">
                        <UserAvatar 
                          profile={friend}
                          className="w-8 h-8"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{friend.name}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No friends online
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Floating Action Button - Mobile Only */}
        <div className="lg:hidden fixed bottom-20 right-4 z-30">
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg bg-gradient-cultural text-white hover:shadow-xl transition-all"
            onClick={() => setShowCreatePost(true)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        {/* Mobile Create Post Modal */}
        {showCreatePost && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreatePost(false)}>
            <div 
              className="fixed bottom-0 left-0 right-0 bg-card rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Create Post</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreatePost(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-2 mb-4">
                  <UserAvatar user={user} size="sm" />
                  <div>
                    <p className="text-sm font-medium">{(user as any)?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">Public</p>
                  </div>
                </div>

                {/* Post Input */}
                <textarea
                  placeholder="What's on your mind?"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="w-full min-h-[120px] p-3 bg-background/60 border border-border/50 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  style={{ fontSize: '16px' }}
                  autoFocus
                />

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="rounded-lg h-full w-full object-cover"
                          loading="lazy"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('mobile-post-image')?.click()}
                      disabled={selectedImages.length >= 4}
                      className="h-9"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Photo
                    </Button>
                    <input
                      id="mobile-post-image"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                    {selectedImages.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {selectedImages.length}/4
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={() => {
                      handleCreatePost();
                      setShowCreatePost(false);
                    }}
                    disabled={isPosting || (!newPost.trim() && selectedImages.length === 0)}
                    className="bg-gradient-cultural text-white"
                  >
                    {isPosting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      'Post'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
