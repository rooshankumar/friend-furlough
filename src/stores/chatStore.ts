import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { connectionManager, supabaseWrapper } from '@/lib/connectionManager';
import { outbox, OutboxItem } from '@/lib/db/outbox';
import { messagesCache } from '@/lib/db/messagesCache';

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
  loadMessages: (conversationId: string, limit?: number) => Promise<void>;
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
    console.log('📡 Loading conversations for user:', userId);
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

      console.log('📊 User participants:', { data: userParticipants });

      if (!userParticipants || userParticipants.length === 0) {
        console.log('ℹ️ No conversations found for user');
        set({ conversations: [], isLoading: false });
        return;
      }

      // Extract conversation IDs
      const conversationIds = userParticipants.map(up => up.conversation_id);

      console.log('🔍 Fetching participants for conversation IDs:', conversationIds);

      // Batch fetch: Get ALL participants for all conversations in one query
      // Note: We need ALL participants (not just current user), so we query by conversation_id only
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
        console.error('Error fetching participants:', allParticipantsError);
        throw allParticipantsError;
      }

      console.log('👥 All participants fetched:', allParticipants);
      console.log('👥 Total participants count:', allParticipants?.length);
      console.log('👥 Expected count (2 per conversation):', conversationIds.length * 2);
      console.log('👥 First participant sample:', JSON.stringify(allParticipants?.[0], null, 2));

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

      console.log('👥 Participants grouped by conversation:', participantsByConversation);

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

      console.log('💬 Final conversations with details:', filteredConversations);
      console.log('💬 First conversation sample:', filteredConversations[0]);

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
  loadMessages: async (conversationId: string, limit: number = 50) => {
    try {
      set({ isLoading: true });

      const { data, error } = await supabase
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
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error loading messages:', error);
        throw error;
      }

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

      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: messagesWithStatus
        },
        isLoading: false
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  sendMessage: async (conversationId: string, senderId: string, content: string, mediaUrl?: string, clientIdOverride?: string, replyToMessageId?: string) => {
    console.log('📤 ChatStore sendMessage called:', { conversationId, senderId, content: content.substring(0, 50), mediaUrl });

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

      console.log('📊 Database insert result:', { data, error });

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
    console.log('📎 Sending attachment:', { conversationId, senderId, fileName: file.name, fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB` });
    // Begin critical section: prevent reconnection while sending placeholder/uploading
    connectionManager.startUpload();

    // Create temporary message for optimistic update
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

    // Add optimistic message to UI
    set(state => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), optimisticMessage]
      }
    }));

    try {
      // STEP 1: Send text message FIRST (so it always goes through)
      console.log('📨 Sending placeholder message first...');
      let data: any = null;
      let error: any = null;

      try {
        const res = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content: `📎 Uploading: ${file.name}`,
            type: 'text',
            client_id: clientId
          })
          .select()
          .single();
        data = res.data; error = res.error;
      } catch (e: any) {
        error = e;
      }

      if (error && (error.code === '42703' || (error.message && /column .*client_id.* does not exist/i.test(error.message)))) {
        console.warn('client_id column missing, retrying without it');
        const fallback = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content: `📎 Uploading: ${file.name}`,
            type: 'text'
          })
          .select()
          .single();
        data = fallback.data; error = fallback.error;
      }

      if (error) {
        console.error('❌ Failed to send placeholder message:', error);
        throw error;
      }

      const messageId = data.id;
      console.log('✅ Placeholder message sent:', messageId);

      // Update UI with real message ID
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: state.messages[conversationId].map(msg =>
            msg.tempId === tempId ? { ...data, uploadProgress: 10, tempId } : msg
          )
        }
      }));

      // STEP 2: Upload attachment in background
      (async () => {
        try {
          console.log('📤 Starting background upload...');
          // Upload already tracked; continue

          // Upload the file to storage
          const { uploadChatAttachment } = await import('@/lib/storage');
          const mediaUrl = await uploadChatAttachment(file, conversationId, (progress) => {
            console.log(`📊 Upload progress: ${progress}%`);
            // Update progress in UI
            set(state => ({
              messages: {
                ...state.messages,
                [conversationId]: state.messages[conversationId].map(msg =>
                  msg.id === messageId ? { ...msg, uploadProgress: progress } : msg
                )
              }
            }));
          });
          console.log('✅ Upload complete:', mediaUrl);

          // STEP 3: Update message with media URL
          const { error: updateError } = await supabase
            .from('messages')
            .update({
              media_url: mediaUrl,
              type: messageType,
              content: file.name
            })
            .eq('id', messageId);

          if (updateError) {
            console.error('❌ Failed to update message with media:', updateError);
            // Message still sent, just without attachment
            set(state => ({
              messages: {
                ...state.messages,
                [conversationId]: state.messages[conversationId].map(msg =>
                  msg.id === messageId ? { 
                    ...msg, 
                    uploadProgress: undefined,
                    content: `${file.name} (Upload completed but failed to update)`
                  } : msg
                )
              }
            }));
            return;
          }

          console.log('✅ Message updated with attachment');

          // Update local state
          set(state => ({
            messages: {
              ...state.messages,
              [conversationId]: state.messages[conversationId].map(msg =>
                msg.id === messageId ? { 
                  ...msg, 
                  media_url: mediaUrl,
                  type: messageType,
                  content: file.name,
                  status: 'sent' as MessageStatus,
                  uploadProgress: undefined
                } : msg
              )
            }
          }));

        } catch (error: any) {
          console.error('❌ Background upload failed:', error);
          console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            statusCode: error.statusCode,
            name: error.name
          });

          // End upload tracking on error
          connectionManager.endUpload();

          // If it's just a bucket error, send text message instead
          const isBucketError = error.message?.includes('Bucket not found') || error.statusCode === '404';

          if (isBucketError) {
            console.log('⚠️ Bucket error - sending text message instead of attachment');

            // Send a simple text message indicating upload wasn't possible
            const fallbackMessage = {
              id: messageId, // Use the ID of the placeholder message
              conversation_id: conversationId,
              sender_id: senderId,
              content: `📎 ${file.name} (Upload temporarily unavailable - please contact admin to configure storage)`,
              type: 'text' as const,
              created_at: new Date().toISOString(),
            };

            // Update local state
            set(state => ({
              messages: {
                ...state.messages,
                [conversationId]: state.messages[conversationId].map(msg =>
                  msg.id === messageId ? fallbackMessage : msg
                )
              }
            }));

            // Send to database
            await supabase.from('messages').insert(fallbackMessage);

            // Update progress to 100% to indicate message sent, even if attachment failed
            set(state => ({
              messages: {
                ...state.messages,
                [conversationId]: state.messages[conversationId].map(msg =>
                  msg.id === messageId ? { ...msg, uploadProgress: 100, content: `📎 ${file.name} (Upload unavailable)` } : msg
                )
              }
            }));
          } else {
            // For other errors, show error in message
            set(state => ({
              messages: {
                ...state.messages,
                [conversationId]: state.messages[conversationId].map(msg =>
                  msg.id === messageId ? { 
                    ...msg, 
                    media_url: null,
                    content: `[Upload failed: ${error.message}]`,
                    type: 'text' as const,
                    uploadProgress: undefined
                  } : msg
                )
              }
            }));
          }

          // Save to outbox for retry if it wasn't a bucket error
          if (!isBucketError) {
            try {
              await outbox.init();
              await outbox.put({
                client_id: `retry_${clientId}`,
                tempId: messageId, // Use the placeholder message ID as tempId for retry
                conversation_id: conversationId,
                sender_id: senderId,
                content: file.name,
                type: messageType, // Use original type
                media_url: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined, // Store a reference if possible
                created_at: new Date().toISOString()
              });
            } catch (e) {
              console.warn('Failed to save to outbox:', e);
            }
          }
        }
      })();

    } catch (error: any) {
      console.error('❌ Error sending attachment message:', error);
      // End upload tracking on early failure
      connectionManager.endUpload();

      // Update status to failed
      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: state.messages[conversationId].map(msg =>
            msg.tempId === tempId ? { 
              ...msg, 
              status: 'failed' as MessageStatus, 
              uploadProgress: undefined,
              content: `Failed to send: ${file.name}`
            } : msg
          )
        }
      }));

      throw error;
    }
  },

  sendVoiceMessage: async (conversationId: string, senderId: string, audioBlob: Blob) => {
    console.log('🎤 Sending voice message:', { conversationId, senderId, size: audioBlob.size, type: audioBlob.type });

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

      console.log('📤 Starting voice upload...');

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
      console.log('📤 Voice uploaded successfully:', mediaUrl);

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
      console.log('📨 Saving voice message to database...');
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
              console.log('📨 New message from another user');
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
    console.log('📤 Processing outbox:', items.length, 'items');
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
      if (conversationId) {
        console.log('🔄 Resubscribing to conversation:', conversationId);
        setTimeout(() => {
          state.subscribeToMessages(conversationId);
        }, 1500);
      }
    }
  });
}