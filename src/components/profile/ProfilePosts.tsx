import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import UserAvatar from '@/components/UserAvatar';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  FileText,
  Plus,
  Image as ImageIcon
} from 'lucide-react';
import { User } from '@/types';

interface ProfilePostsProps {
  userPosts: any[];
  profileUser: User;
  isOwnProfile: boolean;
  user?: User | null;
  postReactions: Record<string, number>;
  userPostReactions: Record<string, boolean>;
  commentCounts: Record<string, number>;
  onLikePost: (postId: string) => void;
}

export const ProfilePosts: React.FC<ProfilePostsProps> = ({
  userPosts,
  profileUser,
  isOwnProfile,
  user,
  postReactions,
  userPostReactions,
  commentCounts,
  onLikePost
}) => {
  const navigate = useNavigate();

  if (userPosts.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-card-foreground">Posts</h3>
        </div>
        
        <div className="text-center py-12">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-card-foreground">No posts yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {isOwnProfile 
              ? "Share your thoughts, experiences, and cultural insights with the community!" 
              : `${profileUser.name} hasn't posted anything yet.`}
          </p>
          {isOwnProfile && (
            <Button 
              className="bg-gradient-cultural text-white hover:opacity-90 transition-opacity" 
              onClick={() => navigate('/community')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Post
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-card-foreground">Posts</h3>
          <span className="text-sm text-muted-foreground">({userPosts.length})</span>
        </div>
        {isOwnProfile && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/community')}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        )}
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {userPosts.map((post: any) => (
          <Card key={post.id} className="hover:shadow-md transition-shadow duration-200 overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <UserAvatar 
                    profile={profileUser}
                    user={isOwnProfile ? user : undefined}
                    size="sm"
                    className="flex-shrink-0"
                  />
                  <div>
                    <h4 className="font-semibold text-sm">{profileUser.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p 
                className="text-foreground leading-relaxed mb-4 line-clamp-3 cursor-pointer hover:text-primary transition-colors"
                onClick={() => navigate(`/post/${post.id}`)}
              >
                {post.content}
              </p>
              
              {post.image_url && (
                <div className="mb-4 relative group cursor-pointer" onClick={() => navigate(`/post/${post.id}`)}>
                  <img 
                    src={post.image_url} 
                    alt="Post image" 
                    className="rounded-lg w-full h-48 object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-1 text-muted-foreground border-t pt-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`flex-1 ${userPostReactions[`${post.id}_like`] ? 'text-red-500' : ''}`}
                  onClick={() => onLikePost(post.id)}
                >
                  <Heart className={`h-4 w-4 mr-1 ${userPostReactions[`${post.id}_like`] ? 'fill-current' : ''}`} />
                  <span className="text-xs">
                    {postReactions[`${post.id}_like`] || 0}
                  </span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => navigate(`/post/${post.id}`)}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  <span className="text-xs">
                    {commentCounts[post.id] || 0}
                  </span>
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  <Share className="h-4 w-4 mr-1" />
                  <span className="text-xs">Share</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View All Posts Button */}
      {userPosts.length > 4 && (
        <div className="text-center pt-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/community')}
          >
            View All Posts
          </Button>
        </div>
      )}
    </div>
  );
};
