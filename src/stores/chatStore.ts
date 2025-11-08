import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { connectionManager, supabaseWrapper } from '@/lib/connectionManager';
import { outbox, OutboxItem } from '@/lib/db/outbox';
import { messagesCache } from '@/lib/db/messagesCache';
import { toast } from 'sonner';

type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

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
  status?: MessageStatus;
  tempId?: string; // For optimistic updates
  uploadProgress?: number; // For attachment uploads
  client_id?: string; // For idempotency and reconciliation
  reply_to_message_id?: string; // For reply functionality
  reply_to?: {
    content: string;
    sender_name: string;
    sender_id: string;
    type?: string;
    media_url?: string;
  }; // Populated reply data
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
  typingUsers: { [conversationId: string]: { [userId: string]: string } }; // userId -> userName
  offlineQueue: DbMessage[]; // Messages waiting to be sent
  isProcessingOutbox?: boolean;

  // Actions
  loadConversations: (userId: string) => Promise<void>;
  loadMessages: (conversationId: string, limit?: number, loadMore?: boolean) => Promise<void>;
  loadMoreMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, senderId: string, content: string, mediaUrl?: string, clientIdOverride?: string, replyToMessageId?: string) => Promise<any>;
  sendAttachment: (conversationId: string, senderId: string, file: File) => Promise<void>;
  sendVoiceMessage: (conversationId: string, senderId: string, audioBlob: Blob) => Promise<void>;
  markMessageAsRead: (messageId: string, userId: string) => Promise<void>;
  markAsRead: (conversationId: string, userId: string) => Promise<void>;
  subscribeToMessages: (conversationId: string) => any;
  unsubscribeFromMessages: () => void;
  broadcastTyping: (conversationId: string, userId: string, userName: string, isTyping: boolean) => void;
  updateMessageStatus: (tempId: string, status: MessageStatus, realId?: string) => void;
  updateMessageStatusById: (messageId: string, conversationId: string, status: MessageStatus) => void;
  processOfflineQueue: () => Promise<void>;
  deleteConversation: (conversationId: string, userId: string) => Promise<void>;
  removeTempMessage: (conversationId: string, tempId: string) => void;
}

// Generate idempotent client IDs (safe for reconciliation)
const generateClientId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: {},
  isLoading: false,
  activeChannel: null,
  typingUsers: {},
  offlineQueue: [],
  isProcessingOutbox: false,

  loadConversations: async (userId: string) => {
    set({ isLoading: true });

    try {
      const result = await supabaseWrapper.withRetry(async () => {
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

        if (participantError) throw participantError;
        return userParticipants;
      }, 'load conversations');

      const userParticipants = result;

      if (!userParticipants || userParticipants.length === 0) {
        console.log('ℹ️ No conversations found');
        set({ conversations: [], isLoading: false });
        return;
      }

      // Extract unique conversation IDs (remove duplicates)
      const conversationIds = [...new Set(userParticipants.map(up => up.conversation_id))];

      // Batch fetch: Get ALL participants for all conversations in one query
      const { data: allParticipants, error: allParticipantsError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          user_id,
          profiles!conversation_participants_user_id_fkey (
            id,
            name,
            avatar_url,
            country_flag,
            online,
            last_seen
          )
        `)
        .in('conversation_id', conversationIds);

      if (allParticipantsError) {
        console.error('❌ Error fetching participants:', allParticipantsError);
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

      // Assemble final conversations array (deduplicate by conversation_id)
      const conversationMap = new Map<string, ConversationWithDetails>();
      userParticipants.forEach(up => {
        const conversation = (up as any).conversations;
        const convId = conversation.id;
        
        // Only add if not already in map (first occurrence wins)
        if (!conversationMap.has(convId)) {
          conversationMap.set(convId, {
            id: convId,
            created_at: conversation.created_at,
            updated_at: conversation.updated_at,
            is_language_exchange: conversation.is_language_exchange,
            language: conversation.language,
            participants: participantsByConversation[up.conversation_id] || [],
            lastMessage: lastMessageByConversation[up.conversation_id],
            unreadCount: up.unread_count || 0
          });
        }
      });
      
      const conversationsWithDetails = Array.from(conversationMap.values());

      // Filter out permanently deleted conversations
      const deletedConvs = JSON.parse(localStorage.getItem('deletedConversations') || '[]');
      const filteredConversations = conversationsWithDetails.filter(
        conv => !deletedConvs.includes(conv.id)
      );

      // Sort by most recent activity
      filteredConversations.sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.updated_at;
        const bTime = b.lastMessage?.created_at || b.updated_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });


      set({ conversations: filteredConversations, isLoading: false });
    } catch (error) {
      console.error('Error loading conversations:', error);
      set({ conversations: [], isLoading: false });
    }
  },
  removeTempMessage: (conversationId: string, tempId: string) => {
    set(state => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).filter(m => m.tempId !== tempId)
      }
    }));
  },
  loadMessages: async (conversationId: string, limit: number = 50, loadMore: boolean = false) => {
    try {
      set({ isLoading: !loadMore }); // Don't show loading spinner when loading more

      console.log('📥 Loading messages for conversation:', conversationId, loadMore ? '(loading more)' : '(initial)');

      const state = get();
      const existingMessages = state.messages[conversationId] || [];
      
      // For loading more, get messages older than the oldest current message
      let query = supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          created_at,
          type,
          media_url,
          reply_to_message_id
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false }) // Get newest first
        .limit(limit);

      // If loading more, get messages older than the oldest we have
      if (loadMore && existingMessages.length > 0) {
        const oldestMessage = existingMessages[0]; // First message is oldest
        query = query.lt('created_at', oldestMessage.created_at);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error loading messages:', error);
        throw error;
      }

      console.log(`✅ Loaded ${data?.length || 0} messages from database`);

      // Get current user to determine message status
      const { data: { user } } = await supabase.auth.getUser();

      // Get all participants to map sender names
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id, profiles(name)')
        .eq('conversation_id', conversationId);

      const userMap = new Map(
        (participants || []).map(p => [p.user_id, p.profiles?.name || 'User'])
      );

      // Add status and populate reply_to data
      const messagesWithStatus = (data || []).map((message, index) => {
        let status: MessageStatus = 'delivered'; // Default for received messages

        if (message.sender_id === user?.id) {
          // For sent messages, determine read status
          // Check if there's a newer message from someone else (indicates they've read this message)
          const laterMessages = (data || []).slice(index + 1);
          const hasLaterReplyFromOthers = laterMessages.some(laterMsg => 
            laterMsg.sender_id !== user.id && 
            new Date(laterMsg.created_at) > new Date(message.created_at)
          );

          // Also check the message_reads table for explicit read status
          status = hasLaterReplyFromOthers ? 'read' : 'delivered';
        }

        // Populate reply_to data if message is a reply
        let reply_to = undefined;
        if (message.reply_to_message_id) {
          const repliedMessage = (data || []).find(m => m.id === message.reply_to_message_id);
          if (repliedMessage) {
            reply_to = {
              content: repliedMessage.content,
              sender_name: userMap.get(repliedMessage.sender_id) || 'User',
              sender_id: repliedMessage.sender_id,
              type: repliedMessage.type,
              media_url: repliedMessage.media_url
            };
          }
        }

        return {
          ...message,
          status,
          reply_to
        };
      });

      // Reverse to get chronological order (oldest to newest)
      const sortedMessages = messagesWithStatus.reverse();

      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: loadMore 
            ? [...sortedMessages, ...existingMessages] // Prepend old messages
            : sortedMessages // Replace with initial messages
        },
        isLoading: false
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  loadMoreMessages: async (conversationId: string) => {
    await get().loadMessages(conversationId, 50, true);
  },

  sendMessage: async (conversationId: string, senderId: string, content: string, mediaUrl?: string, clientIdOverride?: string, replyToMessageId?: string) => {

    // Validate inputs
    if (!conversationId || !senderId || !content.trim()) {
      console.error('❌ Invalid message data:', { conversationId, senderId, hasContent: !!content.trim() });
      throw new Error('Missing required message data');
    }

    const messageType = mediaUrl ? 
      (mediaUrl.includes('.jpg') || mediaUrl.includes('.jpeg') || mediaUrl.includes('.png') || mediaUrl.includes('.gif') || mediaUrl.includes('.webp') ? 'image' : 
       mediaUrl.includes('.webm') || mediaUrl.includes('.mp3') || mediaUrl.includes('.wav') ? 'voice' : 'file') : 'text';

    // Generate client_id for idempotency and reconciliation
    const clientId = clientIdOverride || generateClientId();
    const tempId = `temp_${Date.now()}_${Math.random()}`;

    // Get reply_to data if replying to a message
    let reply_to = undefined;
    if (replyToMessageId) {
      const state = get();
      const conversationMessages = state.messages[conversationId] || [];
      const repliedMessage = conversationMessages.find(m => m.id === replyToMessageId);
      if (repliedMessage) {
        reply_to = {
          content: repliedMessage.content,
          sender_name: repliedMessage.sender_id === senderId ? 'You' : 'User',
          sender_id: repliedMessage.sender_id,
          type: repliedMessage.type,
          media_url: repliedMessage.media_url
        };
      }
    }

    const optimisticMessage: DbMessage = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: senderId,
      content: content || (mediaUrl ? 'Attachment' : ''),
      created_at: new Date().toISOString(),
      type: messageType,
      media_url: mediaUrl,
      status: 'sending',
      tempId,
      client_id: clientId,
      reply_to_message_id: replyToMessageId,
      reply_to
    };

    // Add optimistic message to UI
    set(state => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), optimisticMessage]
      }
    }));

    try {
      // Send to database with client_id for reconciliation
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content: content || (mediaUrl ? 'Attachment' : ''),
          type: messageType,
          media_url: mediaUrl,
          client_id: clientId,
          reply_to_message_id: replyToMessageId
        })
        .select()
        .single();


      if (error) {
        console.error('❌ Database insert failed:', error);
        // Update optimistic message to failed
        set(state => ({
          messages: {
            ...state.messages,
            [conversationId]: state.messages[conversationId]?.map(msg => 
              msg.tempId === tempId ? { ...msg, status: 'failed' as MessageStatus } : msg
            ) || []
          }
        }));
        throw new Error(`Failed to send message: ${error.message}`);
      }

      if (!data) {
        console.error('❌ No data returned from insert');
        // Update optimistic message to failed
        set(state => ({
          messages: {
            ...state.messages,
            [conversationId]: state.messages[conversationId]?.map(msg => 
              msg.tempId === tempId ? { ...msg, status: 'failed' as MessageStatus } : msg
            ) || []
          }
        }));
        throw new Error('Failed to send message: No data returned');
      }

      console.log('✅ Message saved to database successfully!', { id: data.id, content: data.content });

      // Replace optimistic message with real message (delivered status)
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: state.messages[conversationId]?.map(msg => 
            msg.tempId === tempId ? { 
              ...data, 
              status: 'delivered' as MessageStatus 
            } : msg
          ) || []
        }
      }));

      console.log('✅ Message sent successfully to database:', data.id);
      return data;
    } catch (error: any) {
      console.error('❌ SendMessage error:', error);
      throw error;
    }
  },

  sendAttachment: async (conversationId: string, senderId: string, file: File) => {
    connectionManager.startUpload();

    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const clientId = generateClientId();
    const messageType = file.type.startsWith('image/') ? 'image' : 'file';

    const optimisticMessage: DbMessage = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: senderId,
      content: file.name,
      created_at: new Date().toISOString(),
      type: messageType,
      media_url: undefined,
      status: 'sending',
      tempId,
      client_id: clientId,
      uploadProgress: 0
    };

    set(state => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), optimisticMessage]
      }
    }));

    let mediaUrl: string | undefined;
    
    try {
      const { uploadChatAttachment } = await import('@/lib/storage');
      
      mediaUrl = await uploadChatAttachment(file, conversationId, (progress) => {
        set(state => ({
          messages: {
            ...state.messages,
            [conversationId]: state.messages[conversationId].map(msg =>
              msg.tempId === tempId ? { ...msg, uploadProgress: progress } : msg
            )
          }
        }));
      });
      
      connectionManager.endUpload();
      
      // Display immediately with Cloudinary URL
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: state.messages[conversationId].map(msg =>
            msg.tempId === tempId ? { 
              ...msg,
              media_url: mediaUrl,
              status: 'sent',
              uploadProgress: 100
            } : msg
          )
        }
      }));

      // Save to attachments table and messages table
      console.log('💾 Saving attachment to database...', { conversationId, senderId, fileName: file.name, mediaUrl });
      
      try {
        // 1. Save to attachments table
        const { data: attachment, error: attachmentError } = await supabase
          .from('attachments')
          .insert({
            conversation_id: conversationId,
            user_id: senderId,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            cloudinary_url: mediaUrl
          })
          .select()
          .single();

        if (attachmentError) {
          console.error('❌ Failed to save attachment:', attachmentError);
          throw attachmentError;
        }

        console.log('✅ Attachment saved to attachments table!', { id: attachment.id });

        // 2. Save message with attachment reference
        const { data: message, error: messageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content: file.name,
            type: messageType,
            media_url: mediaUrl,
            client_id: clientId
          })
          .select()
          .single();

        if (messageError) {
          console.error('❌ Failed to save message:', messageError);
          throw messageError;
        }

        console.log('✅ Message saved to database successfully!', { id: message.id, created_at: message.created_at });
        
        // Update with real database ID
        set(state => ({
          messages: {
            ...state.messages,
            [conversationId]: state.messages[conversationId].map(msg =>
              msg.client_id === clientId ? { 
                ...msg,
                id: message.id,
                status: 'delivered',
                created_at: message.created_at
              } : msg
            )
          }
        }));
      } catch (err) {
        console.error('❌ Error saving attachment to database:', err);
        // Keep the message visible with the Cloudinary URL even if DB save fails
        // It will still be displayed but won't persist after refresh
      }
    } catch (error: any) {
      connectionManager.endUpload();

      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: state.messages[conversationId].map(msg =>
            msg.tempId === tempId ? { 
              ...msg, 
              status: 'failed' as MessageStatus,
              uploadProgress: undefined,
              error: error.message || 'Upload failed'
            } : msg
          )
        }
      }));

      throw error;
    }
  },

  sendVoiceMessage: async (conversationId: string, senderId: string, audioBlob: Blob) => {

    // Create temporary message for optimistic update
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const clientId = generateClientId();

    const optimisticMessage: DbMessage = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: senderId,
      content: 'Voice message',
      created_at: new Date().toISOString(),
      type: 'voice',
      media_url: undefined,
      status: 'sending',
      tempId,
      client_id: clientId,
      uploadProgress: 0
    };

    // Add optimistic message to UI immediately
    set(state => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), optimisticMessage]
      }
    }));

    try {
      // Import the upload function
      const { uploadVoiceMessage } = await import('@/lib/storage');


      // Simulate progress for voice upload (no actual progress API for blob upload)
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: state.messages[conversationId].map(msg =>
            msg.tempId === tempId ? { ...msg, uploadProgress: 30 } : msg
          )
        }
      }));

      // Upload the voice message
      const mediaUrl = await uploadVoiceMessage(audioBlob, conversationId);

      // Update progress to 70% before database save
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: state.messages[conversationId].map(msg =>
            msg.tempId === tempId ? { ...msg, uploadProgress: 70, media_url: mediaUrl } : msg
          )
        }
      }));

      // Send message with voice attachment to database (with client_id for idempotency)
      let data: any = null; let error: any = null;
      try {
        const res = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content: 'Voice message',
            type: 'voice',
            media_url: mediaUrl,
            client_id: clientId
          })
          .select()
          .single();
        data = res.data; error = res.error;
      } catch (e: any) { error = e; }
      if (error && (error.code === '42703' || (error.message && /column .*client_id.* does not exist/i.test(error.message)))) {
        console.warn('client_id column missing on server (voice), retrying without it');
        const fallback = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content: 'Voice message',
            type: 'voice',
            media_url: mediaUrl
          })
          .select()
          .single();
        data = fallback.data; error = fallback.error;
      }

      if (error) throw error;

      // Replace temporary message with real one
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: state.messages[conversationId].map(msg =>
            msg.tempId === tempId ? { ...data, status: 'sent' as MessageStatus } : msg
          )
        }
      }));

      console.log('✅ Voice message sent successfully');
    } catch (error) {
      console.error('❌ Error sending voice message:', error);

      // Update status to failed
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: state.messages[conversationId].map(msg =>
            msg.tempId === tempId ? { ...msg, status: 'failed' as MessageStatus, uploadProgress: undefined } : msg
          )
        }
      }));

      // Persist to outbox for retry if upload succeeded and connection issue
      try {
        if (!navigator.onLine || !connectionManager.connected) {
          await outbox.init();
          const last = get().messages[conversationId]?.find(m => m.tempId === tempId);
          const mediaUrl = last?.media_url;
          if (mediaUrl) {
            await outbox.put({
              client_id: clientId,
              tempId,
              conversation_id: conversationId,
              sender_id: senderId,
              content: 'Voice message',
              type: 'voice',
              media_url: mediaUrl,
              created_at: optimisticMessage.created_at
            });
          }
        }
      } catch (e) {
        console.warn('Outbox persist (voice) failed', e);
      }

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

      // Update message status to 'read' in local state
      set(state => {
        const updatedMessages = { ...state.messages };
        Object.keys(updatedMessages).forEach(conversationId => {
          updatedMessages[conversationId] = updatedMessages[conversationId].map(msg => 
            msg.id === messageId ? { ...msg, status: 'read' as MessageStatus } : msg
          );
        });
        return { messages: updatedMessages };
      });

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
    const { activeChannel } = get();
    
    // Prevent duplicate subscriptions to the same conversation
    if (activeChannel && activeChannel.topic === `messages:${conversationId}`) {
      console.log('✅ Already subscribed to conversation:', conversationId);
      return activeChannel;
    }

    console.log('Subscribing to messages for conversation:', conversationId);

    // Unsubscribe from previous channel if exists
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
              const incoming: any = payload.new;

              // If already present by id, skip (prevents duplicates)
              const messageExistsById = existingMessages.some((m: any) => m.id === incoming.id);
              if (messageExistsById) {
                console.log('✅ Message already exists by id, skipping duplicate');
                return state;
              }

              // IMPROVED: Reconcile with optimistic message using client_id (primary) or tempId (fallback)
              let replaced = false;
              const reconciled = existingMessages.map((m: any) => {
                // Skip if already replaced
                if (replaced) return m;

                // Primary: Match by client_id (most reliable)
                if (incoming.client_id && m.client_id && incoming.client_id === m.client_id) {
                  console.log('✅ Reconciled message by client_id:', incoming.client_id);
                  replaced = true;
                  return { ...(incoming as DbMessage), status: 'delivered' };
                }

                // Fallback: Match by tempId (for messages sent without client_id)
                if (m.tempId && m.status === 'sending' && m.sender_id === incoming.sender_id) {
                  // Additional validation: check if content and type match
                  const contentMatch = m.content === incoming.content;
                  const typeMatch = m.type === incoming.type;
                  const mediaMatch = (m.media_url || '') === (incoming.media_url || '');

                  // Only match if at least 2 of 3 criteria match (prevents false positives)
                  const matchScore = [contentMatch, typeMatch, mediaMatch].filter(Boolean).length;
                  if (matchScore >= 2) {
                    console.log('⚠️ Reconciled message by heuristic (tempId):', m.tempId);
                    replaced = true;
                    return { ...(incoming as DbMessage), status: 'delivered' };
                  }
                }

                return m;
              });

              if (replaced) {
                console.log('✅ Message reconciled successfully');
                return {
                  messages: {
                    ...state.messages,
                    [conversationId]: reconciled
                  }
                };
              }

              // No match found - this is a new message from another user
              const newMessage: DbMessage = { ...(incoming as DbMessage), status: 'delivered' };

              return {
                messages: {
                  ...state.messages,
                  [conversationId]: [...existingMessages, newMessage]
                }
              };
            });

            // Persist incoming to cache (non-blocking)
            (async () => {
              try {
                await messagesCache.init();
                await messagesCache.saveMessage({ ...(payload.new as any), status: 'delivered' } as any);
              } catch {}
            })();
          }
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, userName, isTyping } = payload.payload;

        set(state => {
          const updatedTypingUsers = { ...state.typingUsers };
          if (!updatedTypingUsers[conversationId]) {
            updatedTypingUsers[conversationId] = {};
          }

          if (isTyping) {
            updatedTypingUsers[conversationId][userId] = userName;
          } else {
            delete updatedTypingUsers[conversationId][userId];
          }

          return { typingUsers: updatedTypingUsers };
        });

        // Auto-clear typing indicator after 3 seconds
        if (isTyping) {
          setTimeout(() => {
            set(state => {
              const updatedTypingUsers = { ...state.typingUsers };
              if (updatedTypingUsers[conversationId]?.[userId]) {
                delete updatedTypingUsers[conversationId][userId];
              }
              return { typingUsers: updatedTypingUsers };
            });
          }, 3000);
        }
      })
      .subscribe((status) => {
        console.log('Subscription status:', status, 'at', new Date().toLocaleTimeString());

        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to messages:', conversationId);
          set({ activeChannel: channel });
        }
        // Removed automatic reconnection - let the global connection manager handle it
      });

    // Listen for connection changes to resubscribe
    const unsubscribeConnection = connectionManager.onConnectionChange((isOnline) => {
      if (isOnline) {
        setTimeout(() => {
          const { activeChannel: currentChannel } = get();
          if (!currentChannel || currentChannel.state !== 'joined') {
            console.log('Connection restored, resubscribing to messages...');
            get().subscribeToMessages(conversationId);
          }
        }, 2000);
      }
    });

    // Store cleanup function
    (channel as any)._connectionCleanup = unsubscribeConnection;

    return channel;
  },

  unsubscribeFromMessages: () => {
    console.log('Unsubscribing from messages');
    const { activeChannel } = get();
    if (activeChannel) {
      // Clean up connection listener
      if ((activeChannel as any)._connectionCleanup) {
        (activeChannel as any)._connectionCleanup();
      }
      supabase.removeChannel(activeChannel);
      set({ activeChannel: null });
    }
  },

  broadcastTyping: (conversationId: string, userId: string, userName: string, isTyping: boolean) => {
    const { activeChannel } = get();
    if (activeChannel) {
      activeChannel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, userName, isTyping }
      });
    }
  },

  updateMessageStatus: (tempId: string, status: MessageStatus, realId?: string) => {
    set(state => {
      const updatedMessages = { ...state.messages };

      Object.keys(updatedMessages).forEach(convId => {
        updatedMessages[convId] = updatedMessages[convId].map(msg => {
          if (msg.tempId === tempId) {
            return { ...msg, status, ...(realId && { id: realId }) };
          }
          return msg;
        });
      });

      return { messages: updatedMessages };
    });
  },

  updateMessageStatusById: (messageId: string, conversationId: string, status: MessageStatus) => {
    set(state => ({
      messages: {
        ...state.messages,
        [conversationId]: state.messages[conversationId]?.map(msg => 
          msg.id === messageId ? { ...msg, status } : msg
        ) || []
      }
    }));
  },

  processOfflineQueue: async () => {
    if (!navigator.onLine || !connectionManager.connected) return;
    // Guard against concurrent processing
    if (get().isProcessingOutbox) {
      return;
    }
    set({ isProcessingOutbox: true });
    try { await outbox.init(); } catch {}
    const items = await outbox.getAll();
    if (!items || items.length === 0) {
      console.log('📭 No outbox items to process');
      set({ isProcessingOutbox: false });
      return;
    }
    for (const item of items) {
      try {
        await get().sendMessage(item.conversation_id, item.sender_id, item.content, item.media_url, item.client_id);
        await outbox.delete(item.client_id);
        // Update UI status if any optimistic message still shows as failed/sending
        set(state => {
          const updated = { ...state.messages };
          const list = updated[item.conversation_id] || [];
          updated[item.conversation_id] = list.map(m => {
            if ((m.client_id && m.client_id === item.client_id) || (m.tempId && m.tempId === item.tempId)) {
              return { ...m, status: 'sent' as MessageStatus };
            }
            return m;
          });
          return { messages: updated };
        });
      } catch (err) {
        console.warn('Retry send failed for outbox item:', item.client_id, err);
      }
    }
    set({ isProcessingOutbox: false });
  },

  deleteConversation: async (conversationId: string, userId: string) => {
    try {
      console.log('🗑️ Deleting conversation:', conversationId);

      // Store in localStorage for permanent deletion across sessions
      const deletedConvs = JSON.parse(localStorage.getItem('deletedConversations') || '[]');
      if (!deletedConvs.includes(conversationId)) {
        deletedConvs.push(conversationId);
        localStorage.setItem('deletedConversations', JSON.stringify(deletedConvs));
      }

      // Delete the conversation participant record
      const { error } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      if (error) throw error;

      // Remove from local state
      set(state => ({
        conversations: state.conversations.filter(c => c.id !== conversationId),
        messages: {
          ...state.messages,
          [conversationId]: undefined
        }
      }));

      console.log('✅ Conversation permanently deleted:', conversationId);
    } catch (error) {
      console.error('❌ Failed to delete conversation:', error);
      throw error;
    }
  }
}));

// Initialize outbox and wire connection listener for automatic retries
try {
  outbox.init().then(() => {
    // Attempt processing on load if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      useChatStore.getState().processOfflineQueue();
    }
    connectionManager.onConnectionChange((isOnline) => {
      if (isOnline) {
        setTimeout(() => useChatStore.getState().processOfflineQueue(), 1000);
      }
    });
  });
} catch (e) {
  console.warn('Outbox init failed', e);
}

// Listen for Supabase reconnection events
if (typeof window !== 'undefined') {
  window.addEventListener('supabase-reconnected', () => {
    console.log('🔄 Supabase reconnected, resubscribing to active channels...');

    const state = useChatStore.getState();
    const { activeChannel } = state;

    // If there was an active channel, resubscribe
    if (activeChannel && activeChannel.topic) {
      const conversationId = activeChannel.topic.split(':')[1];
      // Validate conversationId is a UUID, not "messages"
      const isValidUUID = conversationId && conversationId.length > 20 && conversationId.includes('-');
      if (conversationId && isValidUUID) {
        console.log('🔄 Resubscribing to conversation:', conversationId);
        setTimeout(() => {
          state.subscribeToMessages(conversationId);
        }, 1500);
      } else {
        console.log('⚠️ Skipping invalid conversation ID:', conversationId);
      }
    }
  });
}