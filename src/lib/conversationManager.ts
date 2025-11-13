import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ConversationResult {
  conversationId: string;
  isNew: boolean;
}

/**
 * Centralized conversation management utility
 * Handles conversation creation, deduplication, and cleanup
 */
export class ConversationManager {
  
  /**
   * Find or create a conversation between two users
   * Always returns existing conversation if found, creates new one only if needed
   */
  static async findOrCreateConversation(
    currentUserId: string, 
    otherUserId: string
  ): Promise<ConversationResult | null> {
    try {
      // Step 1: Check for existing conversation between these two users
      const existingConversation = await this.findExistingConversation(currentUserId, otherUserId);
      
      if (existingConversation) {
        console.log('✅ Found existing conversation:', existingConversation);
        return {
          conversationId: existingConversation,
          isNew: false
        };
      }

      // Step 2: Create new conversation if none exists
      console.log('🆕 Creating new conversation between users:', currentUserId, otherUserId);
      const newConversationId = await this.createNewConversation(currentUserId, otherUserId);
      
      if (newConversationId) {
        return {
          conversationId: newConversationId,
          isNew: true
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Error in findOrCreateConversation:', error);
      toast.error('Failed to create conversation');
      return null;
    }
  }

  /**
   * Find existing conversation between two users
   */
  private static async findExistingConversation(
    currentUserId: string, 
    otherUserId: string
  ): Promise<string | null> {
    // Get all conversations where current user participates
    const { data: currentUserConversations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUserId);

    if (!currentUserConversations || currentUserConversations.length === 0) {
      return null;
    }

    const conversationIds = currentUserConversations.map(c => c.conversation_id);

    // Check if other user participates in any of these conversations
    const { data: sharedConversation } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', otherUserId)
      .in('conversation_id', conversationIds)
      .limit(1)
      .single();

    return sharedConversation?.conversation_id || null;
  }

  /**
   * Create a new conversation between two users
   */
  private static async createNewConversation(
    currentUserId: string, 
    otherUserId: string
  ): Promise<string | null> {
    // Create conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        is_language_exchange: false,
        language: null
      })
      .select()
      .single();

    if (conversationError || !conversation) {
      console.error('❌ Error creating conversation:', conversationError);
      throw conversationError;
    }

    // Add participants
    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: conversation.id, user_id: currentUserId },
        { conversation_id: conversation.id, user_id: otherUserId }
      ]);

    if (participantsError) {
      console.error('❌ Error adding participants:', participantsError);
      // Clean up conversation if participants failed
      await supabase.from('conversations').delete().eq('id', conversation.id);
      throw participantsError;
    }

    console.log('✅ Created new conversation:', conversation.id);
    return conversation.id;
  }

  /**
   * Clean up empty conversations (conversations with no messages)
   * Should be called periodically or when loading conversations
   */
  static async cleanupEmptyConversations(userId: string, minAgeMinutes: number = 1): Promise<void> {
    try {
      // Get user's conversations
      const { data: userConversations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      if (!userConversations || userConversations.length === 0) {
        return;
      }

      const conversationIds = userConversations.map(c => c.conversation_id);

      // Get conversations with their creation dates
      const { data: conversationsData } = await supabase
        .from('conversations')
        .select('id, created_at')
        .in('id', conversationIds);

      if (!conversationsData) return;

      // Calculate cutoff time (conversations older than minAgeMinutes)
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - minAgeMinutes);

      // Find conversations with no messages
      const { data: conversationsWithMessages } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', conversationIds);

      const conversationsWithMessagesIds = new Set(
        conversationsWithMessages?.map(m => m.conversation_id) || []
      );

      // Find empty conversations that are older than cutoff time
      const emptyConversationIds = conversationsData
        .filter(conv => 
          !conversationsWithMessagesIds.has(conv.id) && 
          new Date(conv.created_at) < cutoffTime
        )
        .map(conv => conv.id);

      if (emptyConversationIds.length > 0) {
        console.log(`🧹 Cleaning up ${emptyConversationIds.length} empty conversations`);
        
        // Delete participants first (due to foreign key constraints)
        await supabase
          .from('conversation_participants')
          .delete()
          .in('conversation_id', emptyConversationIds);

        // Delete empty conversations
        await supabase
          .from('conversations')
          .delete()
          .in('id', emptyConversationIds);

        console.log('✅ Cleaned up empty conversations');
      }
    } catch (error) {
      console.error('❌ Error cleaning up empty conversations:', error);
    }
  }

  /**
   * Remove duplicate conversations for a user
   * Keeps the oldest conversation and removes newer duplicates
   */
  static async removeDuplicateConversations(userId: string): Promise<void> {
    try {
      // Get all user's conversations with participant info
      const { data: userConversations } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations!inner(id, created_at),
          user_id
        `)
        .eq('user_id', userId);

      if (!userConversations || userConversations.length === 0) {
        return;
      }

      // Group conversations by other participant
      const conversationsByOtherUser = new Map<string, any[]>();

      for (const conv of userConversations) {
        // Get other participants in this conversation
        const { data: otherParticipants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv.conversation_id)
          .neq('user_id', userId);

        if (otherParticipants && otherParticipants.length === 1) {
          const otherUserId = otherParticipants[0].user_id;
          
          if (!conversationsByOtherUser.has(otherUserId)) {
            conversationsByOtherUser.set(otherUserId, []);
          }
          
          conversationsByOtherUser.get(otherUserId)!.push(conv);
        }
      }

      // Find and remove duplicates
      const conversationsToDelete: string[] = [];

      for (const [otherUserId, conversations] of conversationsByOtherUser) {
        if (conversations.length > 1) {
          // Sort by creation date (oldest first)
          conversations.sort((a, b) => 
            new Date(a.conversations.created_at).getTime() - 
            new Date(b.conversations.created_at).getTime()
          );

          // Keep the first (oldest), mark others for deletion
          const duplicates = conversations.slice(1);
          conversationsToDelete.push(...duplicates.map(c => c.conversation_id));
          
          console.log(`🔄 Found ${duplicates.length} duplicate conversations with user ${otherUserId}`);
        }
      }

      if (conversationsToDelete.length > 0) {
        console.log(`🗑️ Removing ${conversationsToDelete.length} duplicate conversations`);
        
        // Delete participants first
        await supabase
          .from('conversation_participants')
          .delete()
          .in('conversation_id', conversationsToDelete);

        // Delete conversations
        await supabase
          .from('conversations')
          .delete()
          .in('id', conversationsToDelete);

        console.log('✅ Removed duplicate conversations');
      }
    } catch (error) {
      console.error('❌ Error removing duplicate conversations:', error);
    }
  }
}
