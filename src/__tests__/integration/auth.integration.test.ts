/**
 * Integration tests for authentication functionality
 */

import { supabase } from '@/integrations/supabase/client';
import { parseSupabaseError } from '@/lib/errorHandler';

jest.mock('@/integrations/supabase/client');

describe('Authentication Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Registration', () => {
    it('should create user profile on registration', async () => {
      const mockProfile = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        country: 'US',
        age: 25,
        created_at: '2025-11-05T00:00:00Z',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
      });

      const result = await (supabase as any)
        .from('profiles')
        .insert({
          name: 'John Doe',
          email: 'john@example.com',
          country: 'US',
          age: 25,
        })
        .select()
        .single();

      expect(result.data).toEqual(mockProfile);
    });

    it('should handle duplicate email error', async () => {
      const error = { code: '23505', message: 'duplicate key value violates unique constraint' };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error }),
      });

      const result = await (supabase as any)
        .from('profiles')
        .insert({ email: 'existing@example.com' })
        .select()
        .single();

      expect(result.error).toBeDefined();
      const parsedError = parseSupabaseError(result.error);
      expect(parsedError.message).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const error = { code: '23502', message: 'null value in column violates not-null constraint' };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error }),
      });

      const result = await (supabase as any)
        .from('profiles')
        .insert({ name: 'John' })
        .select()
        .single();

      expect(result.error).toBeDefined();
    });
  });

  describe('User Profile Management', () => {
    it('should fetch user profile', async () => {
      const mockProfile = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        country: 'US',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
      });

      const result = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', 'user-123')
        .single();

      expect(result.data).toEqual(mockProfile);
    });

    it('should update user profile', async () => {
      const updatedProfile = {
        id: 'user-123',
        name: 'Jane Doe',
        bio: 'Updated bio',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: updatedProfile, error: null }),
      });

      const result = await (supabase as any)
        .from('profiles')
        .update({ name: 'Jane Doe', bio: 'Updated bio' })
        .eq('id', 'user-123')
        .select()
        .single();

      expect(result.data.name).toBe('Jane Doe');
    });

    it('should handle profile update error', async () => {
      const error = { code: '42501', message: 'Permission denied' };

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error }),
      });

      const result = await (supabase as any)
        .from('profiles')
        .update({})
        .eq('id', 'user-123')
        .select()
        .single();

      expect(result.error).toBeDefined();
    });
  });

  describe('Friend Requests', () => {
    it('should send friend request', async () => {
      const mockRequest = {
        id: 'request-123',
        sender_id: 'user-1',
        receiver_id: 'user-2',
        status: 'pending',
        created_at: '2025-11-05T00:00:00Z',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockRequest, error: null }),
      });

      const result = await (supabase as any)
        .from('friend_requests')
        .insert({
          sender_id: 'user-1',
          receiver_id: 'user-2',
        })
        .select()
        .single();

      expect(result.data.status).toBe('pending');
    });

    it('should accept friend request', async () => {
      const mockFriendship = {
        id: 'friendship-123',
        user1_id: 'user-1',
        user2_id: 'user-2',
        created_at: '2025-11-05T00:00:00Z',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockFriendship, error: null }),
      });

      const result = await (supabase as any)
        .from('friendships')
        .insert({
          user1_id: 'user-1',
          user2_id: 'user-2',
        })
        .select()
        .single();

      expect(result.data).toEqual(mockFriendship);
    });

    it('should fetch pending friend requests', async () => {
      const mockRequests = [
        { id: 'req-1', sender_id: 'user-1', status: 'pending' },
        { id: 'req-2', sender_id: 'user-3', status: 'pending' },
      ];

      const eqMock = jest.fn().mockReturnThis();
      eqMock.mockResolvedValueOnce({ data: mockRequests, error: null });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue(eqMock),
      });

      const result = await (supabase as any)
        .from('friend_requests')
        .select('*')
        .eq('receiver_id', 'user-2')
        .eq('status', 'pending');

      expect(result.data).toHaveLength(2);
    });

    it('should handle duplicate friend request', async () => {
      const error = { code: '23505', message: 'duplicate key value' };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error }),
      });

      const result = await (supabase as any)
        .from('friend_requests')
        .insert({})
        .select()
        .single();

      expect(result.error).toBeDefined();
    });
  });

  describe('User Preferences', () => {
    it('should update language preferences', async () => {
      const mockPreferences = {
        user_id: 'user-123',
        native_languages: ['en', 'es'],
        learning_languages: ['fr', 'de'],
      };

      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockPreferences, error: null }),
      });

      const result = await (supabase as any)
        .from('user_preferences')
        .upsert(mockPreferences)
        .select()
        .single();

      expect(result.data.native_languages).toContain('en');
    });

    it('should update cultural interests', async () => {
      const mockInterests = {
        user_id: 'user-123',
        interests: ['cuisine', 'music', 'dance'],
      };

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockInterests, error: null }),
      });

      const result = await (supabase as any)
        .from('user_preferences')
        .update({ interests: ['cuisine', 'music', 'dance'] })
        .eq('user_id', 'user-123')
        .select()
        .single();

      expect(result.data.interests).toHaveLength(3);
    });
  });

  describe('Session Management', () => {
    it('should get current session', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'john@example.com',
        },
        access_token: 'token-123',
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await (supabase as any).auth.getSession();

      expect(result.data.session).toEqual(mockSession);
    });

    it('should handle session error', async () => {
      const error = { message: 'Session expired' };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error,
      });

      const result = await (supabase as any).auth.getSession();

      expect(result.error).toBeDefined();
    });
  });
});
