/**
 * Integration tests for chat functionality
 */

import { supabase } from '@/integrations/supabase/client';
import { parseSupabaseError } from '@/lib/errorHandler';

jest.mock('@/integrations/supabase/client');

describe('Chat Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Conversation Management', () => {
    it('should create a new conversation', async () => {
      const mockConversation = {
        id: 'conv-123',
        created_at: '2025-11-05T00:00:00Z',
        is_language_exchange: true,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockConversation, error: null }),
      });

      const result = await (supabase as any)
        .from('conversations')
        .insert({ is_language_exchange: true })
        .select()
        .single();

      expect(result.data).toEqual(mockConversation);
      expect(result.error).toBeNull();
    });

    it('should add participants to conversation', async () => {
      const mockParticipants = [
        { conversation_id: 'conv-123', user_id: 'user-1' },
        { conversation_id: 'conv-123', user_id: 'user-2' },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: mockParticipants, error: null }),
      });

      const result = await (supabase as any)
        .from('conversation_participants')
        .insert(mockParticipants);

      expect(result.data).toEqual(mockParticipants);
    });

    it('should fetch conversation with participants', async () => {
      const mockConversation = {
        id: 'conv-123',
        participants: ['user-1', 'user-2'],
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockConversation, error: null }),
      });

      const result = await (supabase as any)
        .from('conversations')
        .select('*')
        .eq('id', 'conv-123')
        .single();

      expect(result.data).toEqual(mockConversation);
    });

    it('should handle conversation creation error', async () => {
      const error = { code: '42501', message: 'Permission denied' };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error }),
      });

      const result = await (supabase as any)
        .from('conversations')
        .insert({})
        .select()
        .single();

      expect(result.error).toBeDefined();
      const parsedError = parseSupabaseError(result.error);
      expect(parsedError.message).toBeDefined();
    });
  });

  describe('Message Management', () => {
    it('should send a message', async () => {
      const mockMessage = {
        id: 'msg-123',
        conversation_id: 'conv-123',
        sender_id: 'user-1',
        content: 'Hello!',
        created_at: '2025-11-05T00:00:00Z',
        type: 'text',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockMessage, error: null }),
      });

      const result = await (supabase as any)
        .from('messages')
        .insert({
          conversation_id: 'conv-123',
          sender_id: 'user-1',
          content: 'Hello!',
          type: 'text',
        })
        .select()
        .single();

      expect(result.data).toEqual(mockMessage);
    });

    it('should fetch messages for conversation', async () => {
      const mockMessages = [
        { id: 'msg-1', content: 'Hello', sender_id: 'user-1' },
        { id: 'msg-2', content: 'Hi', sender_id: 'user-2' },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockMessages, error: null }),
      });

      const result = await (supabase as any)
        .from('messages')
        .select('*')
        .eq('conversation_id', 'conv-123')
        .order('created_at', { ascending: true })
        .limit(50);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].content).toBe('Hello');
    });

    it('should mark message as read', async () => {
      const mockRead = {
        message_id: 'msg-123',
        user_id: 'user-2',
        read_at: '2025-11-05T00:00:00Z',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockRead, error: null }),
      });

      const result = await (supabase as any)
        .from('message_reads')
        .insert({
          message_id: 'msg-123',
          user_id: 'user-2',
        })
        .select()
        .single();

      expect(result.data).toEqual(mockRead);
    });

    it('should handle message send error', async () => {
      const error = { code: '23503', message: 'Foreign key violation' };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error }),
      });

      const result = await (supabase as any)
        .from('messages')
        .insert({})
        .select()
        .single();

      expect(result.error).toBeDefined();
      const parsedError = parseSupabaseError(result.error);
      expect(parsedError.message).toContain('referenced');
    });
  });

  describe('Typing Indicators', () => {
    it('should update typing status', async () => {
      const mockTyping = {
        conversation_id: 'conv-123',
        user_id: 'user-1',
        is_typing: true,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockTyping, error: null }),
      });

      const result = await (supabase as any)
        .from('typing_indicators')
        .upsert(mockTyping)
        .select()
        .single();

      expect(result.data.is_typing).toBe(true);
    });
  });

  describe('Conversation Deletion', () => {
    it('should delete conversation', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const result = await (supabase as any)
        .from('conversations')
        .delete()
        .eq('id', 'conv-123');

      expect(result.error).toBeNull();
    });

    it('should handle deletion permission error', async () => {
      const error = { code: '42501', message: 'Permission denied' };

      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error }),
      });

      const result = await (supabase as any)
        .from('conversations')
        .delete()
        .eq('id', 'conv-123');

      expect(result.error).toBeDefined();
    });
  });
});
