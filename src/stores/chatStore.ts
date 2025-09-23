import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Message, Conversation } from '@/types';

interface ChatState {
  conversations: Conversation[];
  messages: { [conversationId: string]: Message[] };
  typingUsers: { [conversationId: string]: string[] };
  
  // Actions
  loadConversations: () => void;
  loadMessages: (conversationId: string) => void;
  sendMessage: (message: Omit<Message, 'id' | 'timestamp' | 'readBy' | 'reactions'>) => Promise<void>;
  markAsRead: (conversationId: string) => void;
  setTypingStatus: (conversationId: string, userId: string, isTyping: boolean) => void;
  addReaction: (messageId: string, reaction: { userId: string; emoji: string }) => void;
}

// Mock data
const mockConversations: Conversation[] = [
  {
    id: '1',
    participants: ['user1', 'maria-santos'],
    lastMessage: {
      id: 'msg1',
      conversationId: '1',
      senderId: 'maria-santos',
      content: '¡Hola! How do you celebrate New Year in your country? 🎉',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      type: 'text',
      readBy: ['maria-santos'],
    },
    unreadCount: 1,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    language: 'spanish',
    isLanguageExchange: true
  },
  {
    id: '2',
    participants: ['user1', 'yuki-tanaka'],
    lastMessage: {
      id: 'msg2',
      conversationId: '2',
      senderId: 'user1',
      content: 'Thank you for explaining the tea ceremony! It was fascinating 🍵',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      readBy: ['user1', 'yuki-tanaka'],
    },
    unreadCount: 0,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    language: 'japanese',
    isLanguageExchange: true
  },
  {
    id: '3',
    participants: ['user1', 'ahmed-hassan'],
    lastMessage: {
      id: 'msg3',
      conversationId: '3',
      senderId: 'ahmed-hassan',
      content: 'The photos of your local festival look amazing! I would love to visit someday.',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      readBy: ['ahmed-hassan'],
    },
    unreadCount: 0,
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    isLanguageExchange: false
  }
];

const mockMessages: { [key: string]: Message[] } = {
  '1': [
    {
      id: 'msg1-1',
      conversationId: '1',
      senderId: 'maria-santos',
      content: 'Hello! I saw your profile and noticed you\'re learning Spanish. I\'m from Brazil and would love to help you practice! 😊',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      readBy: ['maria-santos', 'user1'],
    },
    {
      id: 'msg1-2',
      conversationId: '1',
      senderId: 'user1',
      content: 'That\'s wonderful! I\'m really excited to learn Spanish. Could you tell me about some Brazilian traditions?',
      timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      readBy: ['maria-santos', 'user1'],
    },
    {
      id: 'msg1-3',
      conversationId: '1',
      senderId: 'maria-santos',
      content: 'Of course! We have many beautiful festivals here. Carnival is probably the most famous, but we also have Festa Junina which celebrates rural traditions with food, music, and dancing! 🎭🎵',
      timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      language: 'portuguese',
      translation: 'Of course! We have many beautiful festivals here...',
      readBy: ['maria-santos', 'user1'],
    },
    {
      id: 'msg1-4',
      conversationId: '1',
      senderId: 'user1',
      content: 'That sounds amazing! I love learning about different cultural celebrations. What kind of food do you eat during Festa Junina?',
      timestamp: new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      readBy: ['maria-santos', 'user1'],
    },
    {
      id: 'msg1-5',
      conversationId: '1',
      senderId: 'maria-santos',
      content: '¡Hola! How do you celebrate New Year in your country? 🎉',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      type: 'text',
      readBy: ['maria-santos'],
    }
  ],
  '2': [
    {
      id: 'msg2-1',
      conversationId: '2',
      senderId: 'yuki-tanaka',
      content: 'こんにちは！I noticed you\'re interested in Japanese culture. Would you like to learn about the tea ceremony?',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      language: 'japanese',
      translation: 'Hello! I noticed you\'re interested in Japanese culture...',
      readBy: ['yuki-tanaka', 'user1'],
    },
    {
      id: 'msg2-2',
      conversationId: '2',
      senderId: 'user1',
      content: 'Yes, absolutely! I find Japanese traditions so fascinating. Could you explain the significance behind it?',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      readBy: ['yuki-tanaka', 'user1'],
    },
    {
      id: 'msg2-3',
      conversationId: '2',
      senderId: 'user1',
      content: 'Thank you for explaining the tea ceremony! It was fascinating 🍵',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      readBy: ['user1', 'yuki-tanaka'],
    }
  ]
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      typingUsers: {},
      
      loadConversations: () => {
        // Simulate API call
        setTimeout(() => {
          set({ conversations: mockConversations });
        }, 500);
      },
      
      loadMessages: (conversationId: string) => {
        // Simulate API call
        setTimeout(() => {
          const currentMessages = get().messages;
          set({
            messages: {
              ...currentMessages,
              [conversationId]: mockMessages[conversationId] || []
            }
          });
        }, 300);
      },
      
      sendMessage: async (messageData) => {
        const { conversationId } = messageData;
        const newMessage: Message = {
          ...messageData,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          readBy: [messageData.senderId]
        };
        
        // Add message to state
        const currentMessages = get().messages;
        const conversationMessages = currentMessages[conversationId] || [];
        
        set({
          messages: {
            ...currentMessages,
            [conversationId]: [...conversationMessages, newMessage]
          }
        });
        
        // Update conversation last message
        const conversations = get().conversations;
        const updatedConversations = conversations.map(conv => 
          conv.id === conversationId 
            ? { 
                ...conv, 
                lastMessage: newMessage, 
                updatedAt: new Date().toISOString() 
              }
            : conv
        );
        
        set({ conversations: updatedConversations });
        
        // Simulate real-time response
        setTimeout(() => {
          const responses = [
            'That\'s really interesting! Tell me more about that.',
            'I love learning about different cultures! 🌍',
            'What a fascinating tradition! We have something similar here.',
            'Thank you for sharing that with me! 😊',
            'I\'d love to experience that someday!'
          ];
          
          const responseMessage: Message = {
            id: (Date.now() + 1).toString(),
            conversationId,
            senderId: conversationId === '1' ? 'maria-santos' : 'yuki-tanaka',
            content: responses[Math.floor(Math.random() * responses.length)],
            timestamp: new Date().toISOString(),
            type: 'text',
            readBy: []
          };
          
          const currentMessages = get().messages;
          const conversationMessages = currentMessages[conversationId] || [];
          
          set({
            messages: {
              ...currentMessages,
              [conversationId]: [...conversationMessages, responseMessage]
            }
          });
        }, 2000);
      },
      
      markAsRead: (conversationId: string) => {
        const conversations = get().conversations;
        const updatedConversations = conversations.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        );
        set({ conversations: updatedConversations });
      },
      
      setTypingStatus: (conversationId: string, userId: string, isTyping: boolean) => {
        const typingUsers = get().typingUsers;
        const currentTyping = typingUsers[conversationId] || [];
        
        const updatedTyping = isTyping
          ? [...currentTyping.filter(id => id !== userId), userId]
          : currentTyping.filter(id => id !== userId);
        
        set({
          typingUsers: {
            ...typingUsers,
            [conversationId]: updatedTyping
          }
        });
      },
      
      addReaction: (messageId: string, reaction) => {
        // Implementation for adding reactions to messages
        console.log('Adding reaction:', messageId, reaction);
      }
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        messages: state.messages
      })
    }
  )
);