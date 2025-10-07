import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { usePostReactionStore } from '@/stores/postReactionStore';
import { usePostCommentStore } from '@/stores/postCommentStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import UserAvatar from '@/components/UserAvatar';
import { Heart, MessageCircle, Share2, Upload, ChevronLeft, ChevronRight, Globe, Trash2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { uploadPostImage } from '@/lib/storage';
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
  const [currentImageIndex, setCurrentImageIndex] = useState<{[key: string]: number}>({});
  const [posts, setPosts] = useState<Post[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showComments, setShowComments] = useState<{[key: string]: boolean}>({});
  const [newComment, setNewComment] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadPosts();
    loadMyPosts();
  }, [user]);

  // Load reactions and comments when posts change
  useEffect(() => {
    if (posts.length > 0) {
      const postIds = posts.map(post => post.id);
      loadMultiplePostReactions(postIds, 'like');
      loadMultiplePostComments(postIds);
    }
  }, [posts, loadMultiplePostReactions, loadMultiplePostComments]);

  const loadPosts = async () => {
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
      console.log('Loaded posts with profiles:', data);
      setPosts(data as any || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMyPosts = async () => {
    if (!user?.id) return;
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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setMyPosts(data as any || []);
    } catch (error) {
      console.error('Error loading my posts:', error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Limit to 4 images
    const filesToAdd = files.slice(0, 4 - selectedImages.length);
    
    if (selectedImages.length + files.length > 4) {
      toast({
        title: "Image limit",
        description: "You can upload a maximum of 4 images per post",
        variant: "destructive",
      });
    }
    
    setSelectedImages([...selectedImages, ...filesToAdd]);
    
    // Generate previews
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
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      console.log('Deleting post:', postId, 'User ID:', user?.id);
      
      const { data, error } = await supabase
        .from('community_posts' as any)
        .delete()
        .eq('id', postId)
        .eq('user_id', user?.id) // Ensure user can only delete their own posts
        .select();

      console.log('Delete result:', { data, error });

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      // Remove from both lists
      setPosts(prev => prev.filter(p => p.id !== postId));
      setMyPosts(prev => prev.filter(p => p.id !== postId));

      toast({
        title: "Post deleted",
        description: "Your post has been removed successfully",
      });
      
      // Force reload posts to ensure sync
      setTimeout(() => {
        loadPosts();
        loadMyPosts();
      }, 500);
    } catch (error: any) {
      console.error('Delete failed:', error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete post. Check console for details.",
        variant: "destructive",
      });
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() && selectedImages.length === 0) {
      toast({
        title: "Content required",
        description: "Please add some content or images",
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
      
      // Upload the first image (we'll use the first one as the main image_url)
      if (selectedImages.length > 0) {
        toast({
          title: "Uploading image...",
          description: "Please wait while we process your image",
        });
        
        try {
          imageUrl = await uploadPostImage(selectedImages[0], user.id);
        } catch (uploadError: any) {
          console.error('Image upload error:', uploadError);
          toast({
            title: "Image upload failed",
            description: uploadError.message || "Failed to upload image. Try a smaller file.",
            variant: "destructive",
          });
          setIsPosting(false);
          return;
        }
      }

      const { error } = await supabase
        .from('community_posts' as any)
        .insert({
          user_id: user.id,
          content: newPost,
          image_url: imageUrl || null,
        });

      if (error) {
        console.error('Post creation error:', error);
        throw new Error(error.message || 'Failed to create post');
      }

      toast({
        title: "Post created! 🎉",
        description: "Your post has been shared with the community",
      });

      setNewPost('');
      setSelectedImages([]);
      setImagePreviews([]);
      loadPosts();
      loadMyPosts();
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: "Failed to create post",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  // Handle like/reaction toggle
  const handleLikePost = async (postId: string) => {
    const success = await toggleReaction(postId, 'like');
    if (!success) {
      toast({
        title: "Failed to update reaction",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  // Handle comment toggle
  const handleToggleComments = async (postId: string) => {
    const isCurrentlyShown = showComments[postId];
    
    setShowComments(prev => ({
      ...prev,
      [postId]: !isCurrentlyShown
    }));

    // Load comments if showing for the first time
    if (!isCurrentlyShown && (!comments[postId] || comments[postId].length === 0)) {
      await loadComments(postId);
    }
  };

  // Handle adding a comment
  const handleAddComment = async (postId: string) => {
    const commentText = newComment[postId]?.trim();
    if (!commentText) return;

    const success = await addComment(postId, commentText);
    if (success) {
      setNewComment(prev => ({
        ...prev,
        [postId]: ''
      }));
      toast({
        title: "Comment added!",
        description: "Your comment has been posted",
      });
    } else {
      toast({
        title: "Failed to add comment",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 top-0 md:left-16 bg-gradient-subtle pb-16 md:pb-0">
        <div className="h-full flex flex-col md:flex-row">
          <div className="md:w-96 md:border-r md:border-border/50 bg-card/30 p-3 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-9 flex-1" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 mb-4 max-w-3xl">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-0 md:left-16 bg-gradient-subtle pb-16 md:pb-0 overflow-hidden">
      <div className="h-full flex flex-col md:flex-row">
        {/* Left Column - Create Post (Compact Horizontal Layout) */}
        <div className="md:w-96 md:border-r md:border-border/50 bg-card/30 overflow-y-auto md:h-full">
          <div className="p-3 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-lg md:text-xl font-bold">Community Feed</h2>
              <Globe className="h-5 w-5 text-primary" />
            </div>
            
            <Card className="p-2 md:p-3">
              <div className="flex items-start gap-2">
                <UserAvatar 
                  user={user}
                  size="md"
                  className="flex-shrink-0"
                />
                <div className="flex-1 flex items-center gap-2">
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
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <Input
                    placeholder="Share your thoughts..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="flex-1 h-9 text-sm"
                  />
                  <Button
                    onClick={handleCreatePost}
                    disabled={isPosting}
                    size="sm"
                    className="h-9 px-3 flex-shrink-0"
                  >
                    {isPosting ? '...' : 'Post'}
                  </Button>
                </div>
              </div>
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="rounded-lg h-16 w-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-0.5 right-0.5 h-4 w-4 p-0 text-xs"
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* My Posts Section */}
            <div className="mt-4 hidden md:block">
              <h3 className="text-sm font-semibold mb-2 px-1">My Posts</h3>
              <div className="space-y-2">
                {myPosts.map((post) => (
                  <Card key={post.id} className="p-3 hover:bg-accent/50 cursor-pointer">
                    <div className="flex items-start gap-2 mb-2">
                      <UserAvatar 
                        user={user}
                        size="md"
                        className="flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                    {post.content && (
                      <p className="text-xs line-clamp-2 mb-2">{post.content}</p>
                    )}
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt="Post"
                        className="rounded w-full h-20 object-cover"
                      />
                    )}
                  </Card>
                ))}
                {myPosts.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No posts yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - All Posts Feed (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 h-full">
          <h2 className="text-xl font-bold mb-4 hidden md:block">All Posts</h2>
          
          <div className="space-y-4 max-w-3xl">
            {posts.map((post) => (
              <Card key={post.id} className="p-3 sm:p-4">
                <div className="flex items-start gap-3 mb-3">
                  <UserAvatar 
                    profile={post.profiles}
                    size="lg"
                    className="flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{post.profiles?.name}</h3>
                      {post.profiles?.country_flag && (
                        <span>{post.profiles.country_flag}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {post.user_id === user?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Post
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {post.content && (
                  <p className="mb-3 text-sm whitespace-pre-wrap">{post.content}</p>
                )}

                {post.image_url && (
                  <div className="relative mb-3 rounded-lg overflow-hidden bg-muted" style={{maxHeight: '400px'}}>
                    <img
                      src={post.image_url}
                      alt="Post"
                      className="w-full h-auto object-contain"
                      style={{maxHeight: '400px'}}
                    />
                  </div>
                )}

                <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground border-t pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`flex-1 ${userReactions[`${post.id}_like`] ? 'text-red-500' : ''}`}
                    onClick={() => handleLikePost(post.id)}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${userReactions[`${post.id}_like`] ? 'fill-current' : ''}`} />
                    <span className="text-xs">
                      {reactions[`${post.id}_like`] || 0} Like{(reactions[`${post.id}_like`] || 0) !== 1 ? 's' : ''}
                    </span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate(`/community/post/${post.id}`)}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    <span className="text-xs">
                      {commentCounts[post.id] || 0} Comment{(commentCounts[post.id] || 0) !== 1 ? 's' : ''}
                    </span>
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1">
                    <Share2 className="h-4 w-4 mr-1" />
                    <span className="text-xs">Share</span>
                  </Button>
                </div>
              </Card>
            ))}

            {posts.length === 0 && (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground">
                  Be the first to share something with the community!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
