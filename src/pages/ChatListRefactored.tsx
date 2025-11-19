import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, MoreVertical, Loader2 } from 'lucide-react';

/**
 * Global Tokens: --primary=#1F6FEB, --bg=#F8F9FB, --card=#FFFFFF, --border=#E8ECEF, --muted=#8A95A3, --text=#1A202C
 * Motion: 150ms fast, 200ms normal, ease-out
 */

interface Conversation {
  id: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isMuted?: boolean;
  is_online?: boolean;
}

export function ChatListRefactored() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data
  const mockConversations: Conversation[] = [
    {
      id: '1',
      participantName: 'Sarah Chen',
      participantAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      lastMessage: 'Hey! How are you doing?',
      lastMessageTime: '2m ago',
      unreadCount: 2,
      is_online: true,
    },
    {
      id: '2',
      participantName: 'Marco Rossi',
      participantAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marco',
      lastMessage: 'Let\'s practice Italian tomorrow',
      lastMessageTime: '1h ago',
      unreadCount: 0,
      is_online: false,
    },
    {
      id: '3',
      participantName: 'Yuki Tanaka',
      participantAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki',
      lastMessage: 'ありがとう!',
      lastMessageTime: '3h ago',
      unreadCount: 0,
      is_online: true,
    },
  ];

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setConversations(mockConversations);
      setFilteredConversations(mockConversations);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = conversations.filter((c) =>
      c.participantName.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredConversations(filtered);
  };

  const handleChatClick = (conversationId: string) => {
    navigate(`/chat/${conversationId}`);
  };

  return (
    <div className="min-h-screen md:ml-16 pb-16 md:pb-0" style={{ backgroundColor: 'var(--bg, #F8F9FB)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{ backgroundColor: 'var(--card, #FFFFFF)', borderColor: 'var(--border, #E8ECEF)' }}
      >
        <div className="px-4 md:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text, #1A202C)' }}>
            Chats
          </h1>
          <button
            onClick={() => navigate('/explore')}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white transition-all duration-150"
            style={{ backgroundColor: 'var(--primary, #1F6FEB)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-hover, #1A5FD6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary, #1F6FEB)';
            }}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 md:px-8 pb-4">
          <div
            className="flex items-center h-10 px-4 rounded-lg border"
            style={{
              backgroundColor: 'var(--card, #FFFFFF)',
              borderColor: 'var(--border, #E8ECEF)',
            }}
          >
            <Search className="w-4 h-4" style={{ color: 'var(--muted, #8A95A3)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search chats..."
              className="flex-1 ml-2 bg-transparent text-sm focus:outline-none"
              style={{ color: 'var(--text, #1A202C)' }}
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main>
        {isLoading ? (
          // Skeleton loaders
          <div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-18 px-4 md:px-8 py-3 border-b animate-pulse flex gap-3"
                style={{
                  borderColor: 'var(--border, #E8ECEF)',
                  backgroundColor: 'var(--card, #FFFFFF)',
                }}
              >
                <div
                  className="w-14 h-14 rounded-full"
                  style={{ backgroundColor: 'var(--border, #E8ECEF)' }}
                />
                <div className="flex-1 space-y-2">
                  <div
                    className="h-4 w-32 rounded"
                    style={{ backgroundColor: 'var(--border, #E8ECEF)' }}
                  />
                  <div
                    className="h-3 w-48 rounded"
                    style={{ backgroundColor: 'var(--border, #E8ECEF)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text, #1A202C)' }}>
              No conversations
            </h3>
            <p style={{ color: 'var(--muted, #8A95A3)' }}>Start a new chat to connect</p>
          </div>
        ) : (
          // Conversation list
          <div>
            {filteredConversations.map((conv, idx) => (
              <div
                key={conv.id}
                onClick={() => handleChatClick(conv.id)}
                className="h-18 px-4 md:px-8 py-3 border-b hover:bg-opacity-50 transition-colors duration-150 cursor-pointer flex items-center gap-3"
                style={{
                  backgroundColor: conv.unreadCount > 0 ? 'rgba(31, 111, 235, 0.05)' : 'var(--card, #FFFFFF)',
                  borderColor: 'var(--border, #E8ECEF)',
                  animation: `slideUpFadeIn 200ms ease-out forwards`,
                  animationDelay: `${idx * 50}ms`,
                }}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={conv.participantAvatar}
                    alt={conv.participantName}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  {conv.is_online && (
                    <div
                      className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                      style={{
                        backgroundColor: 'var(--success, #24A148)',
                        borderColor: 'var(--card, #FFFFFF)',
                      }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className="font-semibold truncate"
                      style={{
                        color: 'var(--text, #1A202C)',
                        fontWeight: conv.unreadCount > 0 ? '600' : '500',
                      }}
                    >
                      {conv.participantName}
                    </h3>
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--muted, #8A95A3)' }}>
                      {conv.lastMessageTime}
                    </span>
                  </div>
                  <p className="text-sm truncate" style={{ color: 'var(--muted, #8A95A3)' }}>
                    {conv.lastMessage}
                  </p>
                </div>

                {/* Unread badge */}
                {conv.unreadCount > 0 && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                    style={{ backgroundColor: 'var(--primary, #1F6FEB)' }}
                  >
                    {conv.unreadCount}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <style>{`
        @keyframes slideUpFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default ChatListRefactored;
