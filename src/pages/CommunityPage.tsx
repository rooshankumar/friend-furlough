import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Image, 
  Globe, 
  Camera,
  MapPin,
  Languages,
  Plus,
  Filter,
  Bookmark,
  MoreHorizontal,
  Send,
  Smile
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCommunityStore } from '@/stores/communityStore';
import { useAuthStore } from '@/stores/authStore';
import { CulturalBadge } from '@/components/CulturalBadge';

const CommunityPage = () => {
  const [postContent, setPostContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [showPostComposer, setShowPostComposer] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{[key: string]: string}>({});
  const { toast } = useToast();
  
  const { 
    posts, 
    createPost, 
    addComment, 
    addReaction, 
    loadPosts 
  } = useCommunityStore();
  
  const { user } = useAuthStore();

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleCreatePost = async () => {
    if (!postContent.trim() || !user) return;

    try {
      await createPost({
        authorId: user.id,
        content: postContent.trim(),
        type: 'cultural-moment',
        culturalTags: ['daily-life'],
        languageTags: ['english'],
        images: selectedImages.map((_, index) => `image-${index}.jpg`)
      });
      
      setPostContent('');
      setSelectedImages([]);
      setShowPostComposer(false);
      
      toast({
        title: "Post shared!",
        description: "Your cultural moment has been shared with the community.",
      });
    } catch (error) {
      toast({
        title: "Failed to create post",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleAddComment = async (postId: string) => {
    const comment = commentInputs[postId];
    if (!comment?.trim() || !user) return;

    try {
      await addComment(postId, {
        authorId: user.id,
        content: comment.trim()
      });
      
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      
      toast({
        title: "Comment added!",
        description: "Your comment has been shared.",
      });
    } catch (error) {
      toast({
        title: "Failed to add comment",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleReaction = async (postId: string, type: 'appreciate' | 'learn' | 'support' | 'love') => {
    if (!user) return;

    try {
      await addReaction(postId, {
        userId: user.id,
        type
      });
    } catch (error) {
      toast({
        title: "Failed to react",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Cultural Community
              </h1>
              <p className="text-muted-foreground">
                Share your culture, discover others, and build global friendships
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button 
                onClick={() => setShowPostComposer(!showPostComposer)}
                className="bg-gradient-cultural text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Share Culture
              </Button>
            </div>
          </div>
          
          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="cursor-pointer">
              <Globe className="h-3 w-3 mr-1" />
              All Cultures
            </Badge>
            <Badge variant="outline" className="cursor-pointer">
              🍜 Food
            </Badge>
            <Badge variant="outline" className="cursor-pointer">
              🎵 Music
            </Badge>
            <Badge variant="outline" className="cursor-pointer">
              🎭 Traditions
            </Badge>
            <Badge variant="outline" className="cursor-pointer">
              🌍 Travel
            </Badge>
            <Badge variant="outline" className="cursor-pointer">
              📚 Language Learning
            </Badge>
          </div>
        </div>

        {/* Post Composer */}
        {showPostComposer && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Share Your Cultural Moment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="bg-gradient-cultural text-white">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="What cultural moment would you like to share today? Tell us about your traditions, daily life, or something interesting from your culture..."
                    className="min-h-[100px] resize-none"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Add Photos
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    Location
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Languages className="h-4 w-4 mr-2" />
                    Language
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPostComposer(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreatePost}
                    disabled={!postContent.trim()}
                    className="bg-gradient-cultural text-white"
                  >
                    Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback className="bg-gradient-cultural text-white">
                        M
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Maria Santos</h3>
                        <CulturalBadge type="country" flag="🇧🇷">Brazil</CulturalBadge>
                        <Badge variant="outline" className="text-xs">
                          <Languages className="h-3 w-3 mr-1" />
                          Portuguese
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                        <span>•</span>
                        <MapPin className="h-3 w-3" />
                        <span>São Paulo, Brazil</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Post Content */}
                  <p className="text-foreground leading-relaxed">
                    {post.content}
                  </p>

                  {/* Cultural & Language Tags */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {post.culturalTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                    {post.languageTags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Languages className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Post Images */}
                  {post.images && post.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
                      {post.images.slice(0, 4).map((image, index) => (
                        <div 
                          key={index} 
                          className="aspect-square bg-gradient-cultural/20 flex items-center justify-center rounded-lg"
                        >
                          <Image className="h-8 w-8 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  {/* Post Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>{post.reactions.length} reactions</span>
                      <span>{post.comments.length} comments</span>
                      <span>{post.shareCount} shares</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between border-t border-border/50 pt-3">
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleReaction(post.id, 'appreciate')}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        Appreciate
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleReaction(post.id, 'learn')}
                        className="text-muted-foreground hover:text-primary"
                      >
                        📚 Learn
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleReaction(post.id, 'support')}
                        className="text-muted-foreground hover:text-primary"
                      >
                        🤝 Support
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleReaction(post.id, 'love')}
                        className="text-muted-foreground hover:text-red-500"
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        Love
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Comment
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  {post.comments.length > 0 && (
                    <div className="space-y-3 border-t border-border/50 pt-3">
                      {post.comments.slice(0, 3).map((comment) => (
                        <div key={comment.id} className="flex items-start space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder-user.jpg" />
                            <AvatarFallback className="bg-gradient-cultural text-white text-xs">
                              J
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 bg-accent/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">João Silva</span>
                              <CulturalBadge type="country" flag="🇵🇹">Portugal</CulturalBadge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment */}
                  <div className="flex items-center space-x-3 border-t border-border/50 pt-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback className="bg-gradient-cultural text-white text-xs">
                        {user?.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex items-center space-x-2">
                      <Input
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ 
                          ...prev, 
                          [post.id]: e.target.value 
                        }))}
                        placeholder="Add a cultural comment..."
                        className="flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddComment(post.id);
                          }
                        }}
                      />
                      <Button 
                        size="sm"
                        onClick={() => handleAddComment(post.id)}
                        disabled={!commentInputs[post.id]?.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center py-8">
          <Button variant="outline" className="px-8">
            Load More Cultural Posts
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;