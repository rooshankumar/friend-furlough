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
  activeChannel: any | null;
  
  // Actions
  loadConversations: (userId: string) => Promise<void>;
  loadMessages: (conversationId: string, limit?: number) => Promise<void>;
  sendMessage: (conversationId: string, senderId: string, content: string, mediaUrl?: string) => Promise<void>;
  sendAttachment: (conversationId: string, senderId: string, file: File) => Promise<void>;
  sendVoiceMessage: (conversationId: string, senderId: string, audioBlob: Blob) => Promise<void>;
  markMessageAsRead: (messageId: string, userId: string) => Promise<void>;
  markAsRead: (conversationId: string, userId: string) => Promise<void>;
  subscribeToMessages: (conversationId: string) => any;
  unsubscribeFromMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: {},
  isLoading: false,
  activeChannel: null,
  
  loadConversations: async (userId: string) => {
    console.log('📡 Loading conversations for user:', userId);
    set({ isLoading: true });
    try {
      // Optimized: Single query to get user's conversations with participants
      const { data: userParticipants, error: participantError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          unread_count,
          conversations!inner (
            id,
            created_at,
            updated_at,
            is_language_exchange,
            language
          )
        `)
        .eq('user_id', userId);
      
      console.log('📊 User participants:', { data: userParticipants, error: participantError });
      
      if (participantError) {
        console.error('❌ Error fetching user conversations:', participantError);
        set({ conversations: [], isLoading: false });
        return;
      }
      
      if (!userParticipants || userParticipants.length === 0) {
        console.log('ℹ️ No conversations found for user');
        set({ conversations: [], isLoading: false });
        return;
      }
      
      // Extract conversation IDs
      const conversationIds = userParticipants.map(up => up.conversation_id);
      
      // Batch fetch: Get all participants for all conversations in one query
      const { data: allParticipants, error: allParticipantsError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          user_id,
          profiles!inner (
            id,
            name,
            avatar_url,
            country_flag
          )
        `)
        .in('conversation_id', conversationIds);
      
      if (allParticipantsError) {
        console.error('Error fetching participants:', allParticipantsError);
        throw allParticipantsError;
      }
      
      // Batch fetch: Get last message for each conversation in one query
      const { data: lastMessages, error: lastMessagesError } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });
      
      if (lastMessagesError) {
        console.error('Error fetching last messages:', lastMessagesError);
      }
      
      // Group participants by conversation_id
      const participantsByConversation: { [key: string]: any[] } = {};
      allParticipants?.forEach(p => {
        if (!participantsByConversation[p.conversation_id]) {
          participantsByConversation[p.conversation_id] = [];
        }
        participantsByConversation[p.conversation_id].push({
          user_id: p.user_id,
          profiles: p.profiles
        });
      });
      
      // Group last messages by conversation_id (take first = most recent)
      const lastMessageByConversation: { [key: string]: DbMessage } = {};
      lastMessages?.forEach(msg => {
        if (!lastMessageByConversation[msg.conversation_id]) {
          lastMessageByConversation[msg.conversation_id] = msg;
        }
      });
      
      // Assemble final conversations array
      const conversationsWithDetails: ConversationWithDetails[] = userParticipants.map(up => {
        const conversation = (up as any).conversations;
        return {
          id: conversation.id,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          is_language_exchange: conversation.is_language_exchange,
          language: conversation.language,
          participants: participantsByConversation[up.conversation_id] || [],
          lastMessage: lastMessageByConversation[up.conversation_id],
          unreadCount: up.unread_count || 0
        };
      });
      
      // Sort by most recent activity
      conversationsWithDetails.sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.updated_at;
        const bTime = b.lastMessage?.created_at || b.updated_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
      
      set({ conversations: conversationsWithDetails, isLoading: false });
    } catch (error) {
      console.error('Error loading conversations:', error);
      set({ conversations: [], isLoading: false });
    }
  },
  
  loadMessages: async (conversationId: string, limit: number = 50) => {
    console.log('📨 Loading messages for conversation:', conversationId);
    try {
      // Load recent messages with pagination
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      console.log('📊 Messages result:', { count: data?.length, error });
      
      if (error) {
        console.error('❌ Error loading messages:', error);
        throw error;
      }
      
      // Reverse to show oldest first (chat order)
      const messagesInOrder = (data || []).reverse();
      
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: messagesInOrder
        }
      }));
      
      console.log('✅ Messages loaded successfully:', messagesInOrder.length);
    } catch (error) {
      console.error('❌ Error loading messages:', error);
    }
  },
  
  sendMessage: async (conversationId: string, senderId: string, content: string, mediaUrl?: string) => {
    console.log('📤 Sending message:', { conversationId, senderId, content: content.substring(0, 50), mediaUrl });
    try {
      const messageType = mediaUrl ? 
        (mediaUrl.includes('.jpg') || mediaUrl.includes('.jpeg') || mediaUrl.includes('.png') || mediaUrl.includes('.gif') || mediaUrl.includes('.webp') ? 'image' : 
         mediaUrl.includes('.webm') || mediaUrl.includes('.mp3') || mediaUrl.includes('.wav') ? 'voice' : 'file') : 'text';
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content: content || (mediaUrl ? 'Attachment' : ''),
          type: messageType,
          media_url: mediaUrl
        })
        .select()
        .single();
      
      console.log('📊 Send result:', { data, error });
      
      if (error) {
        console.error('❌ Error sending message:', error);
        throw error;
      }
      
      // Optimistically add message to local state
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: [...(state.messages[conversationId] || []), data]
        }
      }));
      
      console.log('✅ Message sent successfully');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  },

  sendAttachment: async (conversationId: string, senderId: string, file: File) => {
    console.log('📎 Sending attachment:', { conversationId, senderId, fileName: file.name, fileSize: file.size });
    try {
      // Import the upload function
      const { uploadChatAttachment } = await import('@/lib/storage');
      
      console.log('📤 Starting file upload...');
      // Upload the file
      const mediaUrl = await uploadChatAttachment(file, conversationId);
      console.log('📤 File uploaded successfully:', mediaUrl);
      
      // Send message with attachment
      console.log('📨 Sending message with attachment...');
      await get().sendMessage(conversationId, senderId, file.name, mediaUrl);
      
      console.log('✅ Attachment sent successfully');
    } catch (error) {
      console.error('❌ Error sending attachment:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        conversationId,
        fileName: file.name
      });
      throw error;
    }
  },

  sendVoiceMessage: async (conversationId: string, senderId: string, audioBlob: Blob) => {
    console.log('🎤 Sending voice message:', { conversationId, senderId, size: audioBlob.size });
    try {
      // Import the upload function
      const { uploadVoiceMessage } = await import('@/lib/storage');
      
      console.log('📤 Starting voice upload...');
      // Upload the voice message
      const mediaUrl = await uploadVoiceMessage(audioBlob, conversationId);
      console.log('📤 Voice uploaded successfully:', mediaUrl);
      
      // Send message with voice attachment
      console.log('📨 Sending voice message...');
      await get().sendMessage(conversationId, senderId, 'Voice message', mediaUrl);
      
      console.log('✅ Voice message sent successfully');
    } catch (error) {
      console.error('❌ Error sending voice message:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        conversationId,
        audioSize: audioBlob.size
      });
      throw error;
    }
  },

  markMessageAsRead: async (messageId: string, userId: string) => {
    try {
      // Insert or update message read status - use upsert with onConflict
      const { error } = await supabase
        .from('message_reads')
        .upsert({
          message_id: messageId,
          user_id: userId,
          read_at: new Date().toISOString()
        }, {
          onConflict: 'message_id,user_id'
        });

      if (error) {
        console.error('❌ Error marking message as read:', error);
        // Don't throw error for duplicate key - it's expected
        if (error.code !== '23505') {
          throw error;
        }
      }
      
      console.log('✅ Message marked as read');
    } catch (error) {
      console.error('❌ Error marking message as read:', error);
      // Don't throw for duplicate key errors
      if (error.code !== '23505') {
        throw error;
      }
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
    console.log('Subscribing to messages for conversation:', conversationId);
    
    // Unsubscribe from previous channel if exists
    const { activeChannel } = get();
    if (activeChannel) {
      console.log('Unsubscribing from previous channel');
      supabase.removeChannel(activeChannel);
    }
    
    const channel = supabase
      .channel(`messages:${conversationId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: conversationId }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('New message received:', payload);
          if (payload.new && payload.new.conversation_id === conversationId) {
            
            set(state => {
              const existingMessages = state.messages[conversationId] || [];
              const messageExists = existingMessages.some((m: any) => m.id === payload.new.id);
              
              if (messageExists) {
                console.log('Message already exists, skipping');
                return state;
              }
              
              console.log('Adding new message to state');
              return {
                messages: {
                  ...state.messages,
                  [conversationId]: [...existingMessages, payload.new as any]
                }
              };
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status, 'at', new Date().toLocaleTimeString());
        
        if (status === 'SUBSCRIBED') {
          set({ activeChannel: channel });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.warn('Connection lost, attempting to reconnect...');
          // Attempt to reconnect after a delay
          setTimeout(() => {
            const { activeChannel: currentChannel } = get();
            if (!currentChannel || currentChannel.state !== 'joined') {
              console.log('Reconnecting to messages...');
              get().subscribeToMessages(conversationId);
            }
          }, 3000);
        }
      });
    
    return channel;
  },
  
  unsubscribeFromMessages: () => {
    console.log('Unsubscribing from messages');
    const { activeChannel } = get();
    if (activeChannel) {
      supabase.removeChannel(activeChannel);
      set({ activeChannel: null });
    }
  }
}));
