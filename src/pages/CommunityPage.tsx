import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, Upload, ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadPostImage } from '@/lib/storage';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function CommunityPage() {
  const { user, profile } = useAuthStore();
  const [currentImageIndex, setCurrentImageIndex] = useState<{[key: string]: number}>({});
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

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

  const handleCreatePost = async () => {
    if (!newPost.trim() && selectedImages.length === 0) {
      toast({
        title: "Content required",
        description: "Please add some content or images",
        variant: "destructive",
      });
      return;
    }

    setIsPosting(true);
    try {
      let imageUrl = '';
      
      // Upload the first image (we'll use the first one as the main image_url)
      if (selectedImages.length > 0 && user) {
        imageUrl = await uploadPostImage(selectedImages[0], user.id);
      }

      const { error } = await supabase
        .from('community_posts' as any)
        .insert({
          user_id: user!.id,
          content: newPost,
          image_url: imageUrl || null,
        });

      if (error) throw error;

      toast({
        title: "Post created",
        description: "Your post has been shared with the community",
      });

      setNewPost('');
      setSelectedImages([]);
      setImagePreviews([]);
      loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
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
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-gradient-cultural text-white text-xs">
                    {profile?.name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
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
          </div>
        </div>

        {/* Right Column - Feed (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 h-full">
          <h2 className="text-xl font-bold mb-4 hidden md:block">Posts</h2>
          
          <div className="space-y-4 max-w-3xl">
            {posts.map((post) => (
              <Card key={post.id} className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.profiles?.avatar_url} />
                    <AvatarFallback className="bg-gradient-cultural text-white">{post.profiles?.name?.[0] || '?'}</AvatarFallback>
                  </Avatar>
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

                <div className="flex items-center gap-2 text-muted-foreground border-t pt-2">
                  <Button variant="ghost" size="sm" className="flex-1">
                    <Heart className="h-4 w-4 mr-1" />
                    <span className="text-xs">Like</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    <span className="text-xs">Comment</span>
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
}
