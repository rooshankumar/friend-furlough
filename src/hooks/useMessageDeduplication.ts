import { useState, useCallback, useRef, useEffect } from 'react';

interface MessageRecord {
  clientId: string;
  timestamp: number;
  conversationId: string;
}

/**
 * Message deduplication hook to prevent duplicate messages
 * Uses client_id to track sent messages and prevent duplicates
 */
export const useMessageDeduplication = () => {
  const [sentMessages, setSentMessages] = useState<Set<string>>(new Set());
  const cleanupTimerRef = useRef<NodeJS.Timeout>();
  const messageRecordsRef = useRef<Map<string, MessageRecord>>(new Map());

  // Generate unique client ID for messages
  const generateClientId = useCallback((conversationId: string): string => {
    return `${conversationId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Check if message was already sent
  const isDuplicate = useCallback((clientId: string): boolean => {
    return sentMessages.has(clientId);
  }, [sentMessages]);

  // Mark message as sent
  const markAsSent = useCallback((clientId: string, conversationId: string) => {
    setSentMessages(prev => new Set(prev).add(clientId));
    
    messageRecordsRef.current.set(clientId, {
      clientId,
      timestamp: Date.now(),
      conversationId
    });

    console.log('📝 Message marked as sent:', clientId);
  }, []);

  // Remove message from sent list (for retry scenarios)
  const clearMessage = useCallback((clientId: string) => {
    setSentMessages(prev => {
      const newSet = new Set(prev);
      newSet.delete(clientId);
      return newSet;
    });
    messageRecordsRef.current.delete(clientId);
    console.log('🗑️ Message cleared:', clientId);
  }, []);

  // Cleanup old messages (older than 5 minutes)
  const cleanupOldMessages = useCallback(() => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    
    let cleanedCount = 0;
    
    messageRecordsRef.current.forEach((record, clientId) => {
      if (record.timestamp < fiveMinutesAgo) {
        messageRecordsRef.current.delete(clientId);
        setSentMessages(prev => {
          const newSet = new Set(prev);
          newSet.delete(clientId);
          return newSet;
        });
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old message records`);
    }
  }, []);

  // Get messages for a conversation
  const getConversationMessages = useCallback((conversationId: string): string[] => {
    const messages: string[] = [];
    messageRecordsRef.current.forEach((record, clientId) => {
      if (record.conversationId === conversationId) {
        messages.push(clientId);
      }
    });
    return messages;
  }, []);

  // Clear all messages for a conversation
  const clearConversationMessages = useCallback((conversationId: string) => {
    let clearedCount = 0;
    messageRecordsRef.current.forEach((record, clientId) => {
      if (record.conversationId === conversationId) {
        messageRecordsRef.current.delete(clientId);
        setSentMessages(prev => {
          const newSet = new Set(prev);
          newSet.delete(clientId);
          return newSet;
        });
        clearedCount++;
      }
    });
    console.log(`🗑️ Cleared ${clearedCount} messages for conversation:`, conversationId);
  }, []);

  // Setup periodic cleanup
  useEffect(() => {
    cleanupTimerRef.current = setInterval(cleanupOldMessages, 60000); // Every minute
    
    return () => {
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
      }
    };
  }, [cleanupOldMessages]);

  return {
    generateClientId,
    isDuplicate,
    markAsSent,
    clearMessage,
    getConversationMessages,
    clearConversationMessages,
    sentMessagesCount: sentMessages.size
  };
};
