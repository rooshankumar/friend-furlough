import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { usePostReactionStore } from '@/stores/postReactionStore';
import { usePostCommentStore } from '@/stores/postCommentStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import UserAvatar from '@/components/UserAvatar';
import { Heart, MessageCircle, Upload, Globe, Trash2, MoreHorizontal, Loader2, RefreshCw } from 'lucide-react';
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

  // Optimized load posts with caching
  const loadPosts = useCallback(async (force = false) => {
    if (force) setIsRefreshing(true);
    
    try {
      const { data, error } = await supabase
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
        .limit(50);

      if (error) throw error;
      
      const postsData = (data as any) || [];
      setPosts(postsData);

      // Batch load reactions and comments
      if (postsData.length > 0) {
        const postIds = postsData.map((post: any) => post.id);
        await Promise.all([
          loadMultiplePostReactions(postIds, 'like'),
          loadMultiplePostComments(postIds)
        ]);
      }
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
    }
  }, [loadMultiplePostReactions, loadMultiplePostComments, toast]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

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
      toast({
        title: "Delete failed",
        description: error.message,
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
      toast({
        title: "Failed to create post",
        description: error.message,
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

  if (isLoading) {
    return (
      <div className="min-h-screen md:ml-16 bg-gradient-to-br from-background via-card-cultural/30 to-background pb-16 md:pb-0">
        <div className="h-full flex flex-col md:flex-row">
          <div className="md:w-96 md:border-r md:border-border/50 bg-card/30 p-3 md:p-6">
            <Skeleton className="h-32 w-full rounded-xl mb-4" />
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 mb-4 max-w-3xl">
                <Skeleton className="h-48 w-full" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen md:ml-16 bg-gradient-to-br from-background via-card-cultural/30 to-background pb-16 md:pb-0 overflow-hidden">
      <div className="h-full flex flex-col md:flex-row">
        {/* Create Post Sidebar */}
        <div className="md:w-96 md:border-r md:border-border/50 bg-card/30 backdrop-blur-sm overflow-y-auto md:h-full">
          <div className="p-3 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <h2 className="text-lg md:text-xl font-bold bg-gradient-cultural bg-clip-text text-transparent">
                  Community
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadPosts(true)}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <Card className="p-3 md:p-4 bg-gradient-to-br from-card to-card-cultural border-primary/20">
              <div className="flex items-start gap-2">
                <UserAvatar user={user} size="md" className="flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Share your thoughts..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="bg-background/50"
                  />
                  
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="rounded-lg h-24 w-full object-cover"
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
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('post-image')?.click()}
                      disabled={selectedImages.length >= 4}
                      className="flex-shrink-0"
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
                      className="flex-1 bg-gradient-cultural"
                    >
                      {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {posts.length === 0 ? (
              <Card className="p-12 text-center bg-gradient-to-br from-card to-card-cultural">
                <Globe className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground">
                  Be the first to share something!
                </p>
              </Card>
            ) : (
              posts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-cultural transition-all duration-300 bg-card">
                  <div className="p-4 md:p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div 
                        className="cursor-pointer"
                        onClick={() => navigate(`/profile/${post.user_id}`)}
                      >
                        <UserAvatar 
                          profile={post.profiles}
                          size="md"
                          className="flex-shrink-0"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 
                              className="font-semibold text-card-foreground cursor-pointer hover:text-primary transition-colors"
                              onClick={() => navigate(`/profile/${post.user_id}`)}
                            >
                              {post.profiles?.name || 'Anonymous'}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {new Date(post.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {post.user_id === user?.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleDeletePost(post.id)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </div>

                    <p 
                      className="text-card-foreground leading-relaxed mb-4 cursor-pointer"
                      onClick={() => navigate(`/post/${post.id}`)}
                    >
                      {post.content}
                    </p>

                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt="Post"
                        className="rounded-lg w-full object-cover max-h-96 mb-4 cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => navigate(`/post/${post.id}`)}
                      />
                    )}

                    <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`flex-1 ${userReactions[`${post.id}_like`] ? 'text-red-500' : ''}`}
                        onClick={() => handleLikePost(post.id)}
                      >
                        <Heart className={`h-4 w-4 mr-1 ${userReactions[`${post.id}_like`] ? 'fill-current' : ''}`} />
                        <span className="text-xs">{reactions[`${post.id}_like`] || 0}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleToggleComments(post.id)}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        <span className="text-xs">{commentCounts[post.id] || 0}</span>
                      </Button>
                    </div>

                    {showComments[post.id] && (
                      <div className="mt-4 space-y-3 pt-4 border-t border-border/30">
                        {comments[post.id]?.map((comment: any) => (
                          <div key={comment.id} className="flex gap-2">
                            <UserAvatar profile={comment.profiles} size="sm" />
                            <div className="flex-1 bg-muted rounded-lg p-2">
                              <p className="text-sm font-medium">{comment.profiles?.name}</p>
                              <p className="text-sm text-card-foreground">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a comment..."
                            value={newComment[post.id] || ''}
                            onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                            className="text-sm"
                          />
                          <Button size="sm" onClick={() => handleAddComment(post.id)}>
                            Post
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
