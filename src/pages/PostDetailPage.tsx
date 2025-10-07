import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import UserAvatar from '@/components/UserAvatar';
import { Heart, MessageCircle, Share2, ArrowLeft, Reply, MoreHorizontal, Edit, Trash2, Check, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { usePostReactionStore } from '@/stores/postReactionStore';
import { usePostCommentStore } from '@/stores/postCommentStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
  updated_at: string;
  profiles?: {
    name: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
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
    commentCounts,
    deleteComment,
    editComment
  } = usePostCommentStore();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<{[commentId: string]: string}>({});
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (postId) {
      loadPost();
    }
  }, [postId]);

  useEffect(() => {
    if (post) {
      loadReactionData(post.id, 'like');
      loadComments(post.id);
    }
  }, [post, loadReactionData, loadComments]);

  const loadPost = async () => {
    try {
      setLoading(true);
      
      // First get the post
      const { data: postData, error: postError } = await supabase
        .from('community_posts' as any)
        .select('*')
        .eq('id', postId)
        .single();

      if (postError || !postData) {
        console.error('Error loading post:', postError);
        toast({
          title: "Post not found",
          description: "The post you're looking for doesn't exist.",
          variant: "destructive",
        });
        navigate('/community');
        return;
      }

      // Type assertion for postData - ensure it's the correct type
      const typedPostData = postData as unknown as {
        id: string;
        content: string;
        image_url?: string;
        created_at: string;
        user_id: string;
      };

      // Then get the profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name, avatar_url, country_flag')
        .eq('id', typedPostData.user_id)
        .single();

      // Combine the data
      const combinedPost: Post = {
        id: typedPostData.id,
        content: typedPostData.content,
        image_url: typedPostData.image_url,
        created_at: typedPostData.created_at,
        user_id: typedPostData.user_id,
        profiles: profileError ? undefined : profileData
      };

      setPost(combinedPost);
    } catch (error) {
      console.error('Error loading post:', error);
      navigate('/community');
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async () => {
    if (!post) return;
    
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
    if (!post) return;
    
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
    if (!post) return;
    
    const replyContent = replyTexts[parentCommentId]?.trim();
    if (!replyContent) return;

    const success = await addComment(post.id, replyContent, parentCommentId);
    if (success) {
      setReplyTexts(prev => ({
        ...prev,
        [parentCommentId]: ''
      }));
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

  const handleDeleteComment = async (commentId: string) => {
    if (!post) return;
    
    const success = await deleteComment(commentId, post.id);
    if (success) {
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed",
      });
    } else {
      toast({
        title: "Failed to delete comment",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!post || !editText.trim()) return;
    
    const success = await editComment(commentId, post.id, editText);
    if (success) {
      setEditingComment(null);
      setEditText('');
      toast({
        title: "Comment updated",
        description: "Your comment has been edited",
      });
    } else {
      toast({
        title: "Failed to edit comment",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const startEditing = (commentId: string, currentContent: string) => {
    setEditingComment(commentId);
    setEditText(currentContent);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditText('');
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

  const organizedComments = post ? organizeComments(comments[post.id] || []) : [];

  const CommentComponent: React.FC<{ comment: Comment; level?: number }> = ({ comment, level = 0 }) => (
    <div className={`${level > 0 ? 'ml-4 sm:ml-8 mt-3' : 'mt-4'}`}>
      <div className="flex gap-2 sm:gap-3">
        <UserAvatar 
          profile={comment.profiles}
          size="md"
          className="flex-shrink-0"
        />
        <div className="flex-1">
          <div className="bg-muted rounded-lg px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{comment.profiles?.name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.created_at).toLocaleDateString()}
                  {comment.updated_at !== comment.created_at && (
                    <span className="ml-1">(edited)</span>
                  )}
                </span>
              </div>
              {/* Edit/Delete dropdown for own comments */}
              {comment.user_id === user?.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => startEditing(comment.id, comment.content)}
                    >
                      <Edit className="h-3 w-3 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            {/* Edit mode */}
            {editingComment === comment.id ? (
              <div className="space-y-2">
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleEditComment(comment.id);
                    }
                  }}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEditComment(comment.id)}
                    disabled={!editText.trim()}
                    className="h-6"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelEditing}
                    className="h-6"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm">{comment.content}</p>
            )}
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
              <UserAvatar 
                user={user}
                size="sm"
                className="flex-shrink-0"
              />
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder={`Reply to ${comment.profiles?.name}...`}
                  value={replyTexts[comment.id] || ''}
                  onChange={(e) => setReplyTexts(prev => ({
                    ...prev,
                    [comment.id]: e.target.value
                  }))}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddReply(comment.id);
                    }
                  }}
                  className="text-sm h-8"
                  autoFocus
                />
                <Button 
                  size="sm" 
                  onClick={() => handleAddReply(comment.id)}
                  disabled={!replyTexts[comment.id]?.trim()}
                  className="h-8"
                >
                  Reply
                </Button>
                <Button 
                  variant="ghost"
                  size="sm" 
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyTexts(prev => ({
                      ...prev,
                      [comment.id]: ''
                    }));
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

  if (loading) {
    return (
      <div className="fixed inset-0 top-0 md:left-16 bg-gradient-subtle pb-16 md:pb-0">
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="fixed inset-0 top-0 md:left-16 bg-gradient-subtle pb-16 md:pb-0">
        <div className="p-4 md:p-8 max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <Button onClick={() => navigate('/community')}>
            Back to Community
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-0 md:left-16 bg-gradient-subtle pb-16 md:pb-0 overflow-auto">
      <div className="p-3 sm:p-4 md:p-8 max-w-2xl mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/community')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Community
          </Button>
        </div>

        {/* Post Content */}
        <Card className="p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
          <div className="flex items-start gap-3 mb-4">
            <UserAvatar 
              profile={post.profiles}
              size="xl"
              className="flex-shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{post.profiles?.name}</h3>
                {post.profiles?.country_flag && (
                  <span className="text-lg">{post.profiles.country_flag}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(post.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          {post.content && (
            <p className="mb-4 text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>
          )}

          {post.image_url && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <img
                src={post.image_url}
                alt="Post"
                className="w-full h-auto object-contain max-h-96"
              />
            </div>
          )}

          {/* Post Actions */}
          <div className="flex items-center gap-3 sm:gap-6 pt-4 border-t flex-wrap">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`${userReactions[`${post.id}_like`] ? 'text-red-500' : ''}`}
              onClick={handleLikePost}
            >
              <Heart className={`h-5 w-5 mr-2 ${userReactions[`${post.id}_like`] ? 'fill-current' : ''}`} />
              {reactions[`${post.id}_like`] || 0} Like{(reactions[`${post.id}_like`] || 0) !== 1 ? 's' : ''}
            </Button>
            <Button variant="ghost" size="sm">
              <MessageCircle className="h-5 w-5 mr-2" />
              {commentCounts[post.id] || 0} Comment{(commentCounts[post.id] || 0) !== 1 ? 's' : ''}
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="h-5 w-5 mr-2" />
              Share
            </Button>
          </div>
        </Card>

        {/* Add Comment */}
        <Card className="p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex gap-3">
            <UserAvatar 
              user={user}
              size="lg"
              className="flex-shrink-0"
            />
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
                className="flex-1"
              />
              <Button 
                onClick={handleAddComment}
                disabled={!newComment.trim()}
              >
                Post
              </Button>
            </div>
          </div>
        </Card>

        {/* Comments */}
        <Card className="p-3 sm:p-4">
          <h3 className="font-semibold mb-4">
            Comments ({commentCounts[post.id] || 0})
          </h3>
          
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
        </Card>
      </div>
    </div>
  );
};

export default PostDetailPage;
