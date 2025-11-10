import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { connectionManager, supabaseWrapper } from '@/lib/connectionManager';
import { outbox, OutboxItem } from '@/lib/db/outbox';
import { messagesCache } from '@/lib/db/messagesCache';
import { attachmentCache } from '@/lib/attachmentCache';
import { offlineCache } from '@/lib/offlineCache';
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
  sendAttachment: (conversationId: string, senderId: string, file: File) => Promise<any>;
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
  updateConversationLastMessage: (conversationId: string, newMessage: DbMessage) => Promise<void>; // Added for updating last message
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
      let userParticipants = null;

      try {
        // Try to fetch from network first
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

        userParticipants = result;
      } catch (networkError) {
        console.log('📡 Network failed, trying offline cache...');
        
        // Fallback to cached conversations
        try {
          await offlineCache.init();
          const cachedConversations = await offlineCache.getAll('conversations');
          
          if (cachedConversations.length > 0) {
            console.log(`✅ Loaded ${cachedConversations.length} conversations from offline cache`);
            set({ conversations: cachedConversations, isLoading: false });
            toast.info('Offline Mode - Showing cached conversations');
            return;
          }
        } catch (cacheError) {
          console.error('❌ Cache also failed:', cacheError);
        }
      }

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

      // Filter out permanently deleted conversations AND conversations without messages
      const deletedConvs = JSON.parse(localStorage.getItem('deletedConversations') || '[]');
      const filteredConversations = conversationsWithDetails.filter(
        conv => !deletedConvs.includes(conv.id) && conv.lastMessage !== undefined
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

      let data = null;
      let error = null;

      try {
        // Try to fetch from network first
        let query = supabase
          .from('messages')
          .select(`
            id,
            conversation_id,
            sender_id,
            content,
            created_at,
            type,
            reply_to_message_id,
            media_url
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false }) // Get newest first
          .limit(limit);

        // If loading more, get messages older than the oldest we have
        if (loadMore && existingMessages.length > 0) {
          const oldestMessage = existingMessages[0]; // First message is oldest
          query = query.lt('created_at', oldestMessage.created_at);
        }

        const response = await query;
        data = response.data;
        error = response.error;
      } catch (networkError) {
        console.log('📡 Network failed, trying offline cache...');
        
        // Fallback to cached messages
        try {
          await offlineCache.init();
          const cachedMessages = await offlineCache.getAll('messages');
          
          // Filter messages for this conversation
          data = cachedMessages
            .filter((msg: any) => msg.conversation_id === conversationId)
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, limit);
          
          if (data.length > 0) {
            console.log(`✅ Loaded ${data.length} messages from offline cache`);
            toast.info('Offline Mode - Showing cached messages');
          }
        } catch (cacheError) {
          console.error('❌ Cache also failed:', cacheError);
        }
      }

      if (error) {
        console.error('❌ Error loading messages:', error);
        throw error;
      }

      console.log(`✅ Loaded ${data?.length || 0} messages from database`);

      // media_url is already in messages table - no need for extra query!
      console.log(`✅ Loaded ${data?.length || 0} messages with media_url directly from database`);

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

      // Get message read receipts for all messages
      const messageIds = (data || []).map(m => m.id);
      const { data: messageReads } = await supabase
        .from('message_reads')
        .select('message_id, user_id')
        .in('message_id', messageIds);

      console.log(`📖 Found ${messageReads?.length || 0} read receipts for ${messageIds.length} messages`);

      // Create a map of message_id -> array of user_ids who read it
      const readByMap = new Map<string, string[]>();
      (messageReads || []).forEach(read => {
        if (!readByMap.has(read.message_id)) {
          readByMap.set(read.message_id, []);
        }
        readByMap.get(read.message_id)!.push(read.user_id);
      });

      // Add status and populate reply_to data
      const messagesWithStatus = (data || []).map((message, index) => {
        let status: MessageStatus = 'delivered'; // Default for received messages

        if (message.sender_id === user?.id) {
          // For sent messages, check if other participants have read it
          const readByUsers = readByMap.get(message.id) || [];
          const readByOthers = readByUsers.some(userId => userId !== user.id);
          
          status = readByOthers ? 'read' : 'delivered';
          
          if (readByOthers) {
            console.log(`✅ Message ${message.id.slice(0, 8)} marked as READ by other user`);
          }
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
              media_url: repliedMessage.media_url // Already in message!
            };
          }
        }

        return {
          ...message,
          // media_url is already in message from database
          status,
          reply_to
        };
      });

      // Reverse to get chronological order (oldest to newest)
      const sortedMessages = messagesWithStatus.reverse();

      // Load cached attachments for this conversation
      const cachedAttachments = attachmentCache.getByConversation(conversationId);
      console.log(`📦 Found ${cachedAttachments.length} cached attachments for conversation`);

      // Convert cached attachments to messages
      const cachedMessages: DbMessage[] = cachedAttachments.map(cached => ({
        id: cached.clientId, // Use clientId as temp ID
        conversation_id: cached.conversationId,
        sender_id: cached.senderId,
        content: cached.fileName,
        created_at: cached.createdAt,
        type: cached.messageType,
        media_url: cached.cloudinaryUrl,
        status: 'sent' as MessageStatus,
        client_id: cached.clientId,
        error: cached.retryCount > 0 ? `Retry ${cached.retryCount}/3` : undefined
      }));

      // Merge cached messages with database messages (avoid duplicates by client_id)
      const allMessages = loadMore 
        ? [...sortedMessages, ...existingMessages]
        : sortedMessages;

      // Add cached messages that aren't in the database yet
      cachedMessages.forEach(cached => {
        const exists = allMessages.some(msg => (msg as any).client_id === cached.client_id);
        if (!exists) {
          allMessages.push(cached);
        }
      });

      // Sort by created_at
      allMessages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: allMessages
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
      const insertData = {
        conversation_id: conversationId,
        sender_id: senderId,
        content: content || (mediaUrl ? 'Attachment' : ''),
        type: messageType,
        client_id: clientId,
        reply_to_message_id: replyToMessageId
      };

      console.log('📤 Inserting message to database:', {
        ...insertData,
        note: mediaUrl ? 'Has attachment (stored in attachments table)' : 'Text message'
      });

      const { data, error } = await supabase
        .from('messages')
        .insert(insertData)
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

      console.log('✅ Message saved to database successfully!', { 
        id: data.id, 
        content: data.content,
        type: data.type
      });

      // Note: media_url is now stored in attachments table, not in messages
      // Preserve media_url from optimistic message for display
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: state.messages[conversationId]?.map(msg => 
            msg.tempId === tempId ? { 
              ...data, 
              media_url: msg.media_url || mediaUrl, // Preserve from optimistic or parameter
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
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const clientId = generateClientId();
    const messageType = file.type.startsWith('image/') ? 'image' : 
                       file.type.startsWith('video/') ? 'video' : 'file';

    console.log('📎 sendAttachment called:', { conversationId, file: file.name, type: messageType });

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

    try {
      console.log('📤 Step 1: Uploading to Cloudinary...');
      
      const { uploadToCloudinary } = await import('@/lib/cloudinaryUpload');
      
      const cloudinaryResult = await uploadToCloudinary(file, (progress) => {
        console.log(`📊 Upload progress: ${progress}%`);
        set(state => ({
          messages: {
            ...state.messages,
            [conversationId]: state.messages[conversationId]?.map(msg =>
              msg.tempId === tempId ? { ...msg, uploadProgress: progress } : msg
            ) || []
          }
        }));
      });

      const mediaUrl = cloudinaryResult.secure_url;
      const publicId = cloudinaryResult.public_id;
      console.log('✅ Cloudinary upload complete:', { url: mediaUrl, publicId });

      console.log('📤 Step 2: Creating message with media_url in database...');
      
      // Import simple insert (avoids getSession hanging)
      const { insertMessageSimple } = await import('@/lib/simpleInsert');
      const { messageQueue } = await import('@/lib/messageQueue');
      
      let messageData: any = null;

      try {
        console.log('🔄 Trying simple direct insert (cached token)...');
        
        // Use simple insert with cached token (most reliable on mobile)
        messageData = await insertMessageSimple({
          conversation_id: conversationId,
          sender_id: senderId,
          content: file.name,
          type: messageType,
          client_id: clientId,
          media_url: mediaUrl
        });
        console.log('✅ Simple insert successful:', messageData.id);
      } catch (err: any) {
        console.error('❌ All insert methods failed, using queue fallback:', err);
        
        // FINAL FALLBACK: Queue the message locally and show it in UI
        const queuedId = `queued_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        messageData = {
          id: queuedId,
          conversation_id: conversationId,
          sender_id: senderId,
          content: file.name,
          type: messageType,
          client_id: clientId,
          media_url: mediaUrl,
          created_at: new Date().toISOString()
        };
        
        // Add to queue for later sync
        messageQueue.add({
          id: queuedId,
          conversation_id: conversationId,
          sender_id: senderId,
          content: file.name,
          type: messageType,
          client_id: clientId,
          media_url: mediaUrl,
          created_at: messageData.created_at
        });
        
        console.log('✅ Message queued locally, will sync later:', queuedId);
      }

      // Optional: Save metadata to attachments table (non-blocking)
      (async () => {
        try {
          await supabase
            .from('attachments')
            .insert({
              message_id: messageData.id,
              conversation_id: conversationId,
              cloudinary_url: mediaUrl,
              cloudinary_public_id: publicId,
              file_name: file.name,
              file_size: file.size,
              file_type: file.type
            });
          console.log('✅ Attachment metadata saved');
        } catch (err) {
          console.warn('⚠️ Failed to save attachment metadata (non-critical):', err);
        }
      })();

      // Create complete message object with all data
      const completeMessage: DbMessage = {
        ...messageData,
        media_url: mediaUrl,
        status: 'sent' as MessageStatus,
        uploadProgress: 100
      };

      console.log('📝 Replacing temp message with complete message:', {
        tempId,
        messageId: messageData.id,
        hasMediaUrl: !!mediaUrl
      });

      // Replace temp message with real one INCLUDING media_url for immediate display
      set(state => {
        const currentMessages = state.messages[conversationId] || [];
        console.log('📋 Current messages count:', currentMessages.length);
        
        const updatedMessages = currentMessages.map(msg => {
          if (msg.tempId === tempId) {
            console.log('✅ Found and replacing temp message');
            return completeMessage;
          }
          return msg;
        });

        console.log('📋 Updated messages count:', updatedMessages.length);
        
        return {
          messages: {
            ...state.messages,
            [conversationId]: updatedMessages
          }
        };
      });

      // Update conversation's last message
      await get().updateConversationLastMessage(conversationId, completeMessage);

      console.log('✅ Attachment sent successfully and displayed in UI');

    } catch (error: any) {
      console.error('❌ Failed to send attachment:', error);

      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: state.messages[conversationId]?.map(msg =>
            msg.tempId === tempId ? { ...msg, status: 'failed', uploadProgress: 0 } : msg
          ) || []
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
            type: 'voice'
          })
          .select()
          .single();
        data = fallback.data; error = fallback.error;
      }

      if (error) throw error;

      // Replace temporary message with real one (preserve media_url from optimistic)
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: state.messages[conversationId].map(msg =>
            msg.tempId === tempId ? { ...data, media_url: mediaUrl, status: 'sent' as MessageStatus } : msg
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
      // Insert read receipt
      await supabase
        .from('message_reads')
        .insert({
          message_id: messageId,
          user_id: userId,
          read_at: new Date().toISOString()
        });

      // Update message status in local state
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
          console.log('📨 New message received via realtime:', payload.new.id);
          if (payload.new && payload.new.conversation_id === conversationId) {
            const incoming: any = payload.new;

            // media_url is already in the message (no extra query needed!)
            console.log('📨 Message media_url:', incoming.media_url || 'none');

            set(state => {
              const existingMessages = state.messages[conversationId] || [];

              // If already present by id, skip (prevents duplicates)
              const messageExistsById = existingMessages.some((m: any) => m.id === incoming.id);
              if (messageExistsById) {
                console.log('⚠️ Message already exists by id, skipping duplicate:', incoming.id);
                return state;
              }

              console.log('✅ New message not in local state, processing...');

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
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Message updated:', payload);
          if (payload.new && payload.new.conversation_id === conversationId) {
            set(state => {
              const existingMessages = state.messages[conversationId] || [];
              const updated: any = payload.new;

              // Update the message with the new data (especially media_url)
              const updatedMessages = existingMessages.map((m: any) => {
                if (m.id === updated.id) {
                  console.log('✅ Updating message with new data:', { id: updated.id, media_url: updated.media_url });
                  return { ...m, ...updated, status: 'delivered' };
                }
                return m;
              });

              return {
                messages: {
                  ...state.messages,
                  [conversationId]: updatedMessages
                }
              };
            });
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
  },

  updateConversationLastMessage: async (conversationId: string, newMessage: DbMessage) => {
    set(state => {
      const updatedConversations = state.conversations.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            lastMessage: {
              id: newMessage.id,
              conversation_id: newMessage.conversation_id,
              sender_id: newMessage.sender_id,
              content: newMessage.content,
              created_at: newMessage.created_at,
              type: newMessage.type,
              media_url: newMessage.media_url
            },
            updated_at: newMessage.created_at // Update conversation timestamp
          };
        }
        return conv;
      });

      // Re-sort conversations to place the updated one at the top
      updatedConversations.sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.updated_at;
        const bTime = b.lastMessage?.created_at || b.updated_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      return { conversations: updatedConversations };
    });
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