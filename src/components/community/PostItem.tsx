import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Heart, MessageCircle, Send, MoreHorizontal, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '@/components/UserAvatar';

interface PostItemProps {
  post: {
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
  };
  isOwner: boolean;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  showComments: boolean;
  comments: any[];
  newComment: string;
  onLike: () => void;
  onToggleComments: () => void;
  onCommentChange: (text: string) => void;
  onAddComment: () => void;
  onDelete: () => void;
  renderComment?: (comment: any, depth: number) => React.ReactNode;
}

const renderTextWithHashtags = (text: string) => {
  const parts = text.split(/(\#\w+)/g);
  return parts.map((part, index) => {
    if (part.startsWith('#')) {
      return (
        <span key={index} className="text-primary hover:underline cursor-pointer">
          {part}
        </span>
      );
    }
    return part;
  });
};

export const PostItem: React.FC<PostItemProps> = ({
  post,
  isOwner,
  likeCount,
  commentCount,
  isLiked,
  showComments,
  comments,
  newComment,
  onLike,
  onToggleComments,
  onCommentChange,
  onAddComment,
  onDelete,
  renderComment,
}) => {
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all bg-card border-border/50">
      <div className="p-3 md:p-4">
        {/* Post Header */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="cursor-pointer shrink-0"
            onClick={() => post.user_id && navigate(`/profile/${post.user_id}`)}
          >
            <UserAvatar
              profile={post.profiles}
              size="sm"
              className="w-9 h-9 md:w-10 md:h-10"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4
                  className="font-semibold text-sm cursor-pointer hover:text-primary transition-colors"
                  onClick={() => post.user_id && navigate(`/profile/${post.user_id}`)}
                >
                  {post.profiles?.name || 'Anonymous'}
                </h4>
                {post.profiles?.country_flag && (
                  <span className="text-sm">{post.profiles.country_flag}</span>
                )}
              </div>
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="text-destructive focus:text-destructive text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(post.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Post Content */}
        <p className="text-sm leading-relaxed mb-3 cursor-pointer hover:opacity-80 transition-opacity">
          {renderTextWithHashtags(post.content)}
        </p>

        {/* Post Image */}
        {post.image_url && (
          <div className="rounded-lg overflow-hidden mb-3 bg-muted">
            <img
              src={post.image_url}
              alt="Post"
              loading="lazy"
              decoding="async"
              className="w-full object-cover h-64 md:h-80 cursor-pointer hover:opacity-95 transition-opacity"
            />
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center gap-1 pt-3 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 px-3 text-xs ${
              isLiked ? 'text-red-500 hover:text-red-600' : 'hover:bg-red-500/10'
            }`}
            onClick={onLike}
          >
            <Heart className={`h-3.5 w-3.5 mr-1 ${isLiked ? 'fill-current' : ''}`} />
            <span className="font-medium">{likeCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs hover:bg-primary/10"
            onClick={onToggleComments}
          >
            <MessageCircle className="h-3.5 w-3.5 mr-1" />
            <span className="font-medium">{commentCount}</span>
          </Button>

          <Button variant="ghost" size="sm" className="h-8 px-3 ml-auto">
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 space-y-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {commentCount} Comment{commentCount !== 1 ? 's' : ''}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={onToggleComments}
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
            </div>

            {/* Render Comments */}
            <div className="space-y-2">
              {comments.map((comment) =>
                renderComment ? renderComment(comment, 0) : null
              )}
            </div>

            {/* Add Comment Input */}
            <div className="flex gap-2 pt-2 border-t border-border/30">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => onCommentChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && onAddComment()}
                className="text-xs h-8 bg-background/60"
              />
              <Button size="sm" onClick={onAddComment} className="h-8 px-3">
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Show Comments Button */}
        {!showComments && commentCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 mt-3 text-xs text-muted-foreground hover:text-primary"
            onClick={onToggleComments}
          >
            <ChevronDown className="h-3 w-3 mr-1" />
            View {commentCount} comment{commentCount !== 1 ? 's' : ''}
          </Button>
        )}
      </div>
    </Card>
  );
};
