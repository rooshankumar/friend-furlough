import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, X, Reply, MoreHorizontal } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { usePostReactionStore } from '@/stores/postReactionStore';
import { usePostCommentStore } from '@/stores/postCommentStore';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
  created_at: string;
  profiles?: {
    name: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

interface FullPostViewProps {
  post: Post;
  onClose: () => void;
}

const FullPostView: React.FC<FullPostViewProps> = ({ post, onClose }) => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const { 
    toggleReaction, 
    reactions, 
    userReactions, 
    loadReactionData 
  } = usePostReactionStore();
  const { 
    addComment, 
    loadComments, 
    comments, 
    commentCounts 
  } = usePostCommentStore();

  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    // Load post data when component mounts
    loadReactionData(post.id, 'like');
    loadComments(post.id);
  }, [post.id, loadReactionData, loadComments]);

  const handleLikePost = async () => {
    const success = await toggleReaction(post.id, 'like');
    if (!success) {
      toast({
        title: "Failed to update reaction",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async () => {
    const commentText = newComment.trim();
    if (!commentText) return;

    const success = await addComment(post.id, commentText);
    if (success) {
      setNewComment('');
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

  const handleAddReply = async (parentCommentId: string) => {
    const replyContent = replyText.trim();
    if (!replyContent) return;

    const success = await addComment(post.id, replyContent, parentCommentId);
    if (success) {
      setReplyText('');
      setReplyingTo(null);
      toast({
        title: "Reply added!",
        description: "Your reply has been posted",
      });
    } else {
      toast({
        title: "Failed to add reply",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  // Group comments by parent/child relationship
  const organizeComments = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create map and initialize replies array
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: organize into parent/child structure
    comments.forEach(comment => {
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies!.push(commentMap.get(comment.id)!);
        }
      } else {
        rootComments.push(commentMap.get(comment.id)!);
      }
    });

    return rootComments;
  };

  const organizedComments = organizeComments(comments[post.id] || []);

  const CommentComponent: React.FC<{ comment: Comment; level?: number }> = ({ comment, level = 0 }) => (
    <div className={`${level > 0 ? 'ml-8 mt-3' : 'mt-4'}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.profiles?.avatar_url} />
          <AvatarFallback className="bg-gradient-cultural text-white text-xs">
            {comment.profiles?.name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="bg-muted rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{comment.profiles?.name}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm">{comment.content}</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6 px-2"
              onClick={() => setReplyingTo(comment.id)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          </div>
          
          {/* Reply Input */}
          {replyingTo === comment.id && (
            <div className="mt-2 flex gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-gradient-cultural text-white text-xs">
                  {user?.user_metadata?.name?.[0] || user?.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder={`Reply to ${comment.profiles?.name}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddReply(comment.id);
                    }
                  }}
                  className="text-sm h-8"
                />
                <Button 
                  size="sm" 
                  onClick={() => handleAddReply(comment.id)}
                  disabled={!replyText.trim()}
                  className="h-8"
                >
                  Reply
                </Button>
                <Button 
                  variant="ghost"
                  size="sm" 
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText('');
                  }}
                  className="h-8"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.map((reply) => (
                <CommentComponent key={reply.id} comment={reply} level={level + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Post Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Post Content */}
          <Card className="p-4 mb-4">
            <div className="flex items-start gap-3 mb-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.profiles?.avatar_url} />
                <AvatarFallback className="bg-gradient-cultural text-white">
                  {post.profiles?.name?.[0] || 'U'}
                </AvatarFallback>
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
              <p className="mb-3 whitespace-pre-wrap">{post.content}</p>
            )}

            {post.image_url && (
              <div className="mb-3 rounded-lg overflow-hidden">
                <img
                  src={post.image_url}
                  alt="Post"
                  className="w-full h-auto object-contain max-h-96"
                />
              </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center gap-4 pt-3 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`${userReactions[`${post.id}_like`] ? 'text-red-500' : ''}`}
                onClick={handleLikePost}
              >
                <Heart className={`h-4 w-4 mr-2 ${userReactions[`${post.id}_like`] ? 'fill-current' : ''}`} />
                {reactions[`${post.id}_like`] || 0} Like{(reactions[`${post.id}_like`] || 0) !== 1 ? 's' : ''}
              </Button>
              <Button variant="ghost" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                {commentCounts[post.id] || 0} Comment{(commentCounts[post.id] || 0) !== 1 ? 's' : ''}
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </Card>

          {/* Add Comment */}
          <div className="flex gap-3 mb-4">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-gradient-cultural text-white text-xs">
                {user?.user_metadata?.name?.[0] || user?.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <Button 
                onClick={handleAddComment}
                disabled={!newComment.trim()}
              >
                Post
              </Button>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-1">
            {organizedComments.map((comment) => (
              <CommentComponent key={comment.id} comment={comment} />
            ))}
            
            {organizedComments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullPostView;
