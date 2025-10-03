import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface DbMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  type: string;
  language?: string;
  translation?: string;
  media_url?: string;
}

interface DbConversation {
  id: string;
  created_at: string;
  updated_at: string;
  is_language_exchange: boolean;
  language?: string;
}

interface ConversationWithDetails extends DbConversation {
  participants: any[];
  lastMessage?: DbMessage;
  unreadCount: number;
}

interface ChatState {
  conversations: ConversationWithDetails[];
  messages: { [conversationId: string]: DbMessage[] };
  isLoading: boolean;
  
  // Actions
  loadConversations: (userId: string) => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, senderId: string, content: string) => Promise<void>;
  markAsRead: (conversationId: string, userId: string) => Promise<void>;
  subscribeToMessages: (conversationId: string) => void;
  unsubscribeFromMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: {},
  isLoading: false,
  
  loadConversations: async (userId: string) => {
    set({ isLoading: true });
    try {
      // Get user's conversation participants
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, unread_count')
        .eq('user_id', userId);
      
      if (participantError) throw participantError;
      
      const conversationsWithDetails: ConversationWithDetails[] = [];
      
      for (const participant of participantData || []) {
        // Get conversation details
        const { data: conversation } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', participant.conversation_id)
          .single();
        
        if (!conversation) continue;
        
        // Get all participants for this conversation
        const { data: participantProfiles } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversation.id);
        
        const participants = [];
        for (const p of participantProfiles || []) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, name, avatar_url, country_flag')
            .eq('id', p.user_id)
            .single();
          
          if (profile) {
            participants.push({ user_id: p.user_id, profiles: profile });
          }
        }
        
        // Get last message
        const { data: lastMessageData } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        conversationsWithDetails.push({
          ...conversation,
          participants,
          lastMessage: lastMessageData || undefined,
          unreadCount: participant.unread_count || 0
        });
      }
      
      set({ conversations: conversationsWithDetails, isLoading: false });
    } catch (error) {
      console.error('Error loading conversations:', error);
      set({ isLoading: false });
    }
  },
  
  loadMessages: async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: data || []
        }
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  },
  
  sendMessage: async (conversationId: string, senderId: string, content: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          type: 'text'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Optimistically add message to local state
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: [...(state.messages[conversationId] || []), data]
        }
      }));
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },
  
  markAsRead: async (conversationId: string, userId: string) => {
    try {
      await supabase
        .from('conversation_participants')
        .update({ unread_count: 0 })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);
      
      set(state => ({
        conversations: state.conversations.map(conv =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      }));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  },
  
  subscribeToMessages: (conversationId: string) => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as DbMessage;
          set(state => ({
            messages: {
              ...state.messages,
              [conversationId]: [...(state.messages[conversationId] || []), newMessage]
            }
          }));
        }
      )
      .subscribe();
    
    return channel;
  },
  
  unsubscribeFromMessages: () => {
    supabase.removeAllChannels();
  }
}));