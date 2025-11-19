import { useState } from 'react';
import { Users, MessageCircle, Heart, CheckCircle, Loader2 } from 'lucide-react';

/**
 * Global Tokens: --primary=#1F6FEB, --bg=#F8F9FB, --card=#FFFFFF, --border=#E8ECEF, --muted=#8A95A3, --text=#1A202C
 * Motion: 150ms fast, 200ms normal, ease-out
 */

interface Notification {
  id: string;
  type: 'connection' | 'message' | 'like' | 'comment';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  avatar: string;
  actions?: { label: string; action: () => void }[];
}

export function NotificationsRefactored() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'connection',
      title: 'New Connection Request',
      description: 'Sarah Chen wants to connect with you',
      timestamp: '5m ago',
      isRead: false,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      actions: [
        { label: 'Accept', action: () => {} },
        { label: 'Decline', action: () => {} },
      ],
    },
    {
      id: '2',
      type: 'message',
      title: 'New Message',
      description: 'Marco Rossi: Let\'s practice Italian tomorrow!',
      timestamp: '1h ago',
      isRead: false,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marco',
    },
    {
      id: '3',
      type: 'like',
      title: 'Post Liked',
      description: 'Yuki Tanaka liked your post',
      timestamp: '3h ago',
      isRead: true,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki',
    },
  ]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'connection':
        return <Users className="w-5 h-5" />;
      case 'message':
        return <MessageCircle className="w-5 h-5" />;
      case 'like':
        return <Heart className="w-5 h-5" />;
      default:
        return <MessageCircle className="w-5 h-5" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'connection':
        return 'var(--primary, #1F6FEB)';
      case 'message':
        return 'var(--success, #24A148)';
      case 'like':
        return 'var(--error, #D32F2F)';
      default:
        return 'var(--primary, #1F6FEB)';
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      )
    );
  };

  const handleAction = (notificationId: string, action: () => void) => {
    action();
    handleMarkAsRead(notificationId);
  };

  return (
    <div className="min-h-screen md:ml-16 pb-16 md:pb-0" style={{ backgroundColor: 'var(--bg, #F8F9FB)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b px-4 md:px-8 py-4 flex items-center justify-between"
        style={{ backgroundColor: 'var(--card, #FFFFFF)', borderColor: 'var(--border, #E8ECEF)' }}
      >
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text, #1A202C)' }}>
          Notifications
        </h1>
        <button
          className="text-xs font-semibold transition-colors duration-150"
          style={{ color: 'var(--primary, #1F6FEB)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--primary-hover, #1A5FD6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--primary, #1F6FEB)';
          }}
        >
          Mark all as read
        </button>
      </header>

      {/* Content */}
      <main>
        {notifications.length === 0 ? (
          <div className="text-center py-12 px-4">
            <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--muted, #8A95A3)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text, #1A202C)' }}>
              All caught up!
            </h3>
            <p style={{ color: 'var(--muted, #8A95A3)' }}>You have no new notifications</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border, #E8ECEF)' }}>
            {notifications.map((notif, idx) => (
              <div
                key={notif.id}
                onClick={() => handleMarkAsRead(notif.id)}
                className="px-4 md:px-8 py-4 hover:bg-opacity-50 transition-colors duration-150 cursor-pointer"
                style={{
                  backgroundColor: notif.isRead ? 'var(--card, #FFFFFF)' : 'rgba(31, 111, 235, 0.05)',
                  animation: `slideUpFadeIn 200ms ease-out forwards`,
                  animationDelay: `${idx * 50}ms`,
                }}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: 'rgba(31, 111, 235, 0.1)',
                      color: getIconColor(notif.type),
                    }}
                  >
                    {getIcon(notif.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-sm"
                      style={{
                        color: 'var(--text, #1A202C)',
                        fontWeight: notif.isRead ? '500' : '600',
                      }}
                    >
                      {notif.title}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted, #8A95A3)' }}>
                      {notif.description}
                    </p>
                    <p className="text-xs mt-2" style={{ color: 'var(--muted, #8A95A3)' }}>
                      {notif.timestamp}
                    </p>

                    {/* Actions */}
                    {notif.actions && (
                      <div className="flex gap-2 mt-3">
                        {notif.actions.map((action) => (
                          <button
                            key={action.label}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(notif.id, action.action);
                            }}
                            className="px-3 py-1 rounded text-xs font-semibold transition-all duration-150"
                            style={{
                              backgroundColor: 'var(--primary, #1F6FEB)',
                              color: '#FFFFFF',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--primary-hover, #1A5FD6)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--primary, #1F6FEB)';
                            }}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Unread indicator */}
                  {!notif.isRead && (
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                      style={{ backgroundColor: 'var(--primary, #1F6FEB)' }}
                    />
                  )}
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

export default NotificationsRefactored;
