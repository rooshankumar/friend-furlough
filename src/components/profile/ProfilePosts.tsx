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
    <div className="bg-card rounded-xl border border-border/50 shadow-sm p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">Recent Posts</h3>
          <span className="text-xs text-muted-foreground">({userPosts.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {isOwnProfile && (
            <Button 
              variant="outline" 
              size="sm"
              className="h-7 text-xs"
              onClick={() => navigate('/community')}
            >
              <Plus className="h-3 w-3 mr-1" />
              New
            </Button>
          )}
          {userPosts.length > 3 && (
            <Button 
              variant="ghost" 
              size="sm"
              className="h-7 text-xs"
              onClick={() => navigate('/community')}
            >
              View All →
            </Button>
          )}
        </div>
      </div>

      {/* Horizontal Scrolling Posts */}
      <div className="overflow-x-auto -mx-4 px-4 md:-mx-5 md:px-5">
        <div className="flex gap-3 pb-2">
          {userPosts.slice(0, 6).map((post: any) => (
            <Card 
              key={post.id} 
              className="flex-shrink-0 w-64 hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer"
              onClick={() => navigate(`/post/${post.id}`)}
            >
              {post.image_url && (
                <div className="relative group h-32 overflow-hidden">
                  <img 
                    src={post.image_url} 
                    alt="Post image" 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
              )}
              <CardContent className="p-3">
                <p className={`text-sm text-foreground leading-relaxed mb-3 ${post.image_url ? 'line-clamp-2' : 'line-clamp-4'}`}>
                  {post.content}
                </p>
                
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <button 
                    className={`flex items-center gap-1 hover:text-red-500 transition-colors ${userPostReactions[`${post.id}_like`] ? 'text-red-500' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onLikePost(post.id);
                    }}
                  >
                    <Heart className={`h-3.5 w-3.5 ${userPostReactions[`${post.id}_like`] ? 'fill-current' : ''}`} />
                    <span>{postReactions[`${post.id}_like`] || 0}</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>{commentCounts[post.id] || 0}</span>
                  </div>
                  <span className="ml-auto text-xs">
                    {post.created_at ? new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
