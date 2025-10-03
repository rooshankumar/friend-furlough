import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, Upload } from 'lucide-react';
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
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
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
          profiles (name, avatar_url, country_flag)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts(data as any || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() && !selectedImage) {
      toast({
        title: "Content required",
        description: "Please add some content or an image",
        variant: "destructive",
      });
      return;
    }

    setIsPosting(true);
    try {
      let imageUrl = '';
      
      if (selectedImage && user) {
        imageUrl = await uploadPostImage(selectedImage, user.id);
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
      setSelectedImage(null);
      setImagePreview('');
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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-40 w-full mb-6" />
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 mb-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Community Feed</h1>

      <Card className="p-6 mb-6">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback>{profile?.name?.[0] || '?'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="Share your language learning journey..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="mb-4"
              rows={3}
            />
            {imagePreview && (
              <div className="relative mb-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="rounded-lg max-h-64 object-cover"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview('');
                  }}
                >
                  Remove
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('post-image')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Add Image
              </Button>
              <input
                id="post-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <Button
                onClick={handleCreatePost}
                disabled={isPosting}
                className="ml-auto"
              >
                {isPosting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <Avatar>
                <AvatarImage src={post.profiles?.avatar_url} />
                <AvatarFallback>{post.profiles?.name?.[0] || '?'}</AvatarFallback>
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

            <p className="mb-4 whitespace-pre-wrap">{post.content}</p>

            {post.image_url && (
              <img
                src={post.image_url}
                alt="Post"
                className="rounded-lg w-full mb-4"
              />
            )}

            <div className="flex items-center gap-4 text-muted-foreground">
              <Button variant="ghost" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Like
              </Button>
              <Button variant="ghost" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                Comment
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </Card>
        ))}
      </div>

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
  );
}
