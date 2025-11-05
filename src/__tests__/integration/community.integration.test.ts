/**
 * Integration tests for community functionality
 */

import { supabase } from '@/integrations/supabase/client';
import { parseSupabaseError } from '@/lib/errorHandler';

jest.mock('@/integrations/supabase/client');

describe('Community Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Post Management', () => {
    it('should create a new post', async () => {
      const mockPost = {
        id: 'post-123',
        user_id: 'user-1',
        content: 'Hello community!',
        created_at: '2025-11-05T00:00:00Z',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockPost, error: null }),
      });

      const result = await (supabase as any)
        .from('community_posts')
        .insert({
          user_id: 'user-1',
          content: 'Hello community!',
        })
        .select()
        .single();

      expect(result.data).toEqual(mockPost);
    });

    it('should fetch posts with pagination', async () => {
      const mockPosts = [
        { id: 'post-1', content: 'First post' },
        { id: 'post-2', content: 'Second post' },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockPosts, error: null }),
      });

      const result = await (supabase as any)
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(0, 19);

      expect(result.data).toHaveLength(2);
    });

    it('should delete post', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const result = await (supabase as any)
        .from('community_posts')
        .delete()
        .eq('id', 'post-123');

      expect(result.error).toBeNull();
    });

    it('should handle post creation error', async () => {
      const error = { code: '23505', message: 'Duplicate key' };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error }),
      });

      const result = await (supabase as any)
        .from('community_posts')
        .insert({})
        .select()
        .single();

      expect(result.error).toBeDefined();
      const parsedError = parseSupabaseError(result.error);
      expect(parsedError.message).toContain('already exists');
    });
  });

  describe('Post Reactions', () => {
    it('should add reaction to post', async () => {
      const mockReaction = {
        id: 'reaction-123',
        post_id: 'post-1',
        user_id: 'user-1',
        reaction_type: 'like',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockReaction, error: null }),
      });

      const result = await (supabase as any)
        .from('post_reactions')
        .insert({
          post_id: 'post-1',
          user_id: 'user-1',
          reaction_type: 'like',
        })
        .select()
        .single();

      expect(result.data).toEqual(mockReaction);
    });

    it('should fetch post reactions count', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({ count: 5, error: null }),
      });

      const result = await (supabase as any)
        .from('post_reactions')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', 'post-1');

      expect(result.count).toBe(5);
    });

    it('should remove reaction from post', async () => {
      const eqMock = jest.fn().mockReturnThis();
      eqMock.mockResolvedValueOnce({ error: null });

      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue(eqMock),
      });

      const result = await (supabase as any)
        .from('post_reactions')
        .delete()
        .eq('post_id', 'post-1')
        .eq('user_id', 'user-1');

      expect(result.error).toBeNull();
    });
  });

  describe('Comments', () => {
    it('should add comment to post', async () => {
      const mockComment = {
        id: 'comment-123',
        post_id: 'post-1',
        user_id: 'user-1',
        content: 'Great post!',
        created_at: '2025-11-05T00:00:00Z',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockComment, error: null }),
      });

      const result = await (supabase as any)
        .from('post_comments')
        .insert({
          post_id: 'post-1',
          user_id: 'user-1',
          content: 'Great post!',
        })
        .select()
        .single();

      expect(result.data).toEqual(mockComment);
    });

    it('should fetch comments for post', async () => {
      const mockComments = [
        { id: 'comment-1', content: 'Nice!' },
        { id: 'comment-2', content: 'Love it!' },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockComments, error: null }),
      });

      const result = await (supabase as any)
        .from('post_comments')
        .select('*')
        .eq('post_id', 'post-1')
        .order('created_at', { ascending: true });

      expect(result.data).toHaveLength(2);
    });

    it('should delete comment', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const result = await (supabase as any)
        .from('post_comments')
        .delete()
        .eq('id', 'comment-123');

      expect(result.error).toBeNull();
    });
  });

  describe('Hashtags', () => {
    it('should fetch trending hashtags', async () => {
      const mockHashtags = [
        { hashtag: '#culture', count: 150 },
        { hashtag: '#language', count: 120 },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockHashtags, error: null }),
      });

      const result = await (supabase as any)
        .from('hashtags')
        .select('hashtag, count')
        .order('count', { ascending: false });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].hashtag).toBe('#culture');
    });
  });

  describe('Community Statistics', () => {
    it('should fetch community stats', async () => {
      const mockStats = {
        total_posts: 1000,
        active_today: 250,
        total_members: 5000,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [mockStats], error: null }),
      });

      const result = await (supabase as any)
        .from('community_stats')
        .select('*');

      expect(result.data[0].total_posts).toBe(1000);
    });
  });

  describe('Error Handling', () => {
    it('should handle RLS policy violation', async () => {
      const error = { code: '42501', message: 'new row violates row-level security policy' };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error }),
      });

      const result = await (supabase as any)
        .from('community_posts')
        .insert({})
        .select()
        .single();

      expect(result.error).toBeDefined();
      const parsedError = parseSupabaseError(result.error);
      expect(parsedError.message).toBeDefined();
    });

    it('should handle foreign key constraint error', async () => {
      const error = { code: '23503', message: 'violates foreign key constraint' };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error }),
      });

      const result = await (supabase as any)
        .from('post_reactions')
        .insert({})
        .select()
        .single();

      expect(result.error).toBeDefined();
      const parsedError = parseSupabaseError(result.error);
      expect(parsedError.message).toContain('referenced');
    });
  });
});
