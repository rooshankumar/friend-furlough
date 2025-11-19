import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Loader2 } from 'lucide-react';

/**
 * Global Tokens: --primary=#1F6FEB, --bg=#F8F9FB, --card=#FFFFFF, --border=#E8ECEF, --muted=#8A95A3, --text=#1A202C, --success=#24A148
 * Motion: 150ms fast, 200ms normal, ease-out
 */

interface Post {
  id: string;
  authorName: string;
  authorAvatar: string;
  timestamp: string;
  content: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  image?: string;
}

export function CommunityRefactored() {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      authorName: 'Sarah Chen',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      timestamp: '2h ago',
      content: 'Just finished my first conversation in Spanish! Feeling proud 🎉',
      likes: 24,
      comments: 5,
      isLiked: false,
    },
    {
      id: '2',
      authorName: 'Marco Rossi',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marco',
      timestamp: '4h ago',
      content: 'Language learning tip: Practice speaking daily, even if it\'s just 10 minutes!',
      likes: 156,
      comments: 32,
      isLiked: false,
    },
  ]);

  const handleLike = (postId: string) => {
    setPosts(
      posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLiked: !p.isLiked,
              likes: p.isLiked ? p.likes - 1 : p.likes + 1,
            }
          : p
      )
    );
  };

  return (
    <div className="min-h-screen md:ml-16 pb-16 md:pb-0" style={{ backgroundColor: 'var(--bg, #F8F9FB)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b px-4 md:px-8 py-4 flex items-center justify-between"
        style={{ backgroundColor: 'var(--card, #FFFFFF)', borderColor: 'var(--border, #E8ECEF)' }}
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text, #1A202C)' }}>
          Community
        </h1>
        <button
          className="px-4 py-2 rounded-md font-semibold text-sm text-white transition-all duration-150"
          style={{ backgroundColor: 'var(--primary, #1F6FEB)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary-hover, #1A5FD6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary, #1F6FEB)';
          }}
        >
          + Post
        </button>
      </header>

      {/* Posts */}
      <main className="px-4 md:px-8 py-6 max-w-2xl mx-auto space-y-4">
        {posts.map((post, idx) => (
          <div
            key={post.id}
            className="rounded-lg border p-4"
            style={{
              backgroundColor: 'var(--card, #FFFFFF)',
              borderColor: 'var(--border, #E8ECEF)',
              animation: `slideUpFadeIn 200ms ease-out forwards`,
              animationDelay: `${idx * 50}ms`,
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex gap-3">
                <img
                  src={post.authorAvatar}
                  alt={post.authorName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--text, #1A202C)' }}>
                    {post.authorName}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--muted, #8A95A3)' }}>
                    {post.timestamp}
                  </p>
                </div>
              </div>
              <button style={{ color: 'var(--muted, #8A95A3)' }}>
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--text, #1A202C)' }}>
              {post.content}
            </p>

            {/* Image */}
            {post.image && (
              <img
                src={post.image}
                alt="Post"
                className="w-full rounded-lg mb-3 object-cover max-h-64"
              />
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border, #E8ECEF)' }}>
              <button
                onClick={() => handleLike(post.id)}
                className="flex items-center gap-2 text-sm font-semibold transition-colors duration-150"
                style={{
                  color: post.isLiked ? 'var(--error, #D32F2F)' : 'var(--muted, #8A95A3)',
                }}
              >
                <Heart
                  className="w-4 h-4"
                  fill={post.isLiked ? 'currentColor' : 'none'}
                />
                {post.likes}
              </button>

              <button
                className="flex items-center gap-2 text-sm font-semibold transition-colors duration-150"
                style={{ color: 'var(--muted, #8A95A3)' }}
              >
                <MessageCircle className="w-4 h-4" />
                {post.comments}
              </button>

              <button
                className="flex items-center gap-2 text-sm font-semibold transition-colors duration-150"
                style={{ color: 'var(--muted, #8A95A3)' }}
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>
        ))}
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

export default CommunityRefactored;
