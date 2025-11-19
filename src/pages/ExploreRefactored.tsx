import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, MessageCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

/**
 * Global Tokens: --primary=#1F6FEB, --bg=#F8F9FB, --card=#FFFFFF, --border=#E8ECEF, --muted=#8A95A3, --text=#1A202C
 * Motion: 150ms fast, 200ms normal, ease-out
 */

interface User {
  id: string;
  name: string;
  avatar_url?: string;
  country?: string;
  age?: number;
  gender?: string;
  bio?: string;
  languages?: string[];
  is_online?: boolean;
}

const FILTER_CHIPS = ['All', 'New', 'Online', 'More'];

export function ExploreRefactored() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Mock data for demo
  const mockUsers: User[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      country: '🇺🇸 USA',
      age: 24,
      gender: 'Female',
      bio: 'Learning Spanish, native English speaker',
      languages: ['English', 'Mandarin', 'Spanish'],
      is_online: true,
    },
    {
      id: '2',
      name: 'Marco Rossi',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marco',
      country: '🇮🇹 Italy',
      age: 28,
      gender: 'Male',
      bio: 'Native Italian, learning English',
      languages: ['Italian', 'English', 'French'],
      is_online: true,
    },
    {
      id: '3',
      name: 'Yuki Tanaka',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki',
      country: '🇯🇵 Japan',
      age: 22,
      gender: 'Female',
      bio: 'Japanese native, learning German',
      languages: ['Japanese', 'English', 'German'],
      is_online: false,
    },
  ];

  // Load users on mount
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
      setIsLoading(false);
    }, 500);
  }, []);

  // Debounced search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      let filtered = users;

      // Filter by search query
      if (query) {
        filtered = filtered.filter(
          (u) =>
            u.name.toLowerCase().includes(query.toLowerCase()) ||
            u.bio?.toLowerCase().includes(query.toLowerCase())
        );
      }

      // Filter by active chip
      if (activeFilter === 'Online') {
        filtered = filtered.filter((u) => u.is_online);
      } else if (activeFilter === 'New') {
        filtered = filtered.slice(0, 5);
      }

      setFilteredUsers(filtered);
    }, 300);
  }, [users, activeFilter]);

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    handleSearch(searchQuery);
  };

  const handleChatClick = (userId: string) => {
    navigate(`/chat?userId=${userId}`);
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="min-h-screen md:ml-16 pb-16 md:pb-0" style={{ backgroundColor: 'var(--bg, #F8F9FB)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{ backgroundColor: 'var(--card, #FFFFFF)', borderColor: 'var(--border, #E8ECEF)' }}
      >
        <div className="px-4 md:px-8 py-4 space-y-4">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text, #1A202C)' }}>
            Explore
          </h1>

          {/* Search Bar */}
          <div
            className="flex items-center h-11 px-4 rounded-lg border"
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
              placeholder="Search by name..."
              className="flex-1 ml-2 bg-transparent text-sm focus:outline-none"
              style={{ color: 'var(--text, #1A202C)' }}
            />
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleFilterChange(chip)}
                className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-150"
                style={{
                  backgroundColor:
                    activeFilter === chip ? 'var(--primary, #1F6FEB)' : 'var(--border, #E8ECEF)',
                  color: activeFilter === chip ? '#FFFFFF' : 'var(--text, #1A202C)',
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
        {isLoading ? (
          // Skeleton loaders
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-lg border p-4 animate-pulse"
                style={{
                  backgroundColor: 'var(--card, #FFFFFF)',
                  borderColor: 'var(--border, #E8ECEF)',
                }}
              >
                <div className="flex gap-4">
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
                      className="h-3 w-24 rounded"
                      style={{ backgroundColor: 'var(--border, #E8ECEF)' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--muted, #8A95A3)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text, #1A202C)' }}>
              No users found
            </h3>
            <p style={{ color: 'var(--muted, #8A95A3)' }}>Try adjusting your filters</p>
          </div>
        ) : (
          // User list
          <div className="space-y-4">
            {filteredUsers.map((u, idx) => (
              <div
                key={u.id}
                className="rounded-lg border p-4 hover:border-[var(--primary)] transition-all duration-150 cursor-pointer"
                style={{
                  backgroundColor: 'var(--card, #FFFFFF)',
                  borderColor: 'var(--border, #E8ECEF)',
                  animation: `slideUpFadeIn 200ms ease-out forwards`,
                  animationDelay: `${idx * 50}ms`,
                }}
                onClick={() => handleUserClick(u.id)}
              >
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <img
                      src={u.avatar_url}
                      alt={u.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    {u.is_online && (
                      <div
                        className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                        style={{
                          backgroundColor: 'var(--success, #24A148)',
                          borderColor: 'var(--card, #FFFFFF)',
                        }}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold" style={{ color: 'var(--text, #1A202C)' }}>
                      {u.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted, #8A95A3)' }}>
                      <MapPin className="w-3 h-3" />
                      {u.country} • {u.age} • {u.gender}
                    </div>
                    <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--muted, #8A95A3)' }}>
                      {u.bio}
                    </p>

                    {/* Languages */}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {u.languages?.slice(0, 3).map((lang) => (
                        <span
                          key={lang}
                          className="px-2 py-1 text-xs rounded-full"
                          style={{
                            backgroundColor: 'var(--primary, #1F6FEB)',
                            color: '#FFFFFF',
                          }}
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Chat Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChatClick(u.id);
                    }}
                    className="px-4 py-2 rounded-md font-semibold text-sm text-white transition-all duration-150 h-fit"
                    style={{ backgroundColor: 'var(--primary, #1F6FEB)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--primary-hover, #1A5FD6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--primary, #1F6FEB)';
                    }}
                  >
                    Chat
                  </button>
                </div>
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

export default ExploreRefactored;
