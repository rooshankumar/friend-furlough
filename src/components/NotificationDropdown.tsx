import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '@/stores/notificationStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, MessageCircle, UserPlus, Heart, MessageSquare, Calendar, CheckCheck, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NotificationDropdownProps {
  children: React.ReactNode;
}

const NotificationDropdown = ({ children }: NotificationDropdownProps) => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();

  // Show only recent 5 notifications
  const recentNotifications = notifications.slice(0, 5);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'friend-request':
      case 'friend-accepted':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'post-like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'post-comment':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'event-rsvp':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleOpenChange = (open: boolean) => {
    // Mark all as read when dropdown opens
    if (open && unreadCount > 0) {
      markAllAsRead();
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 ml-2">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                markAllAsRead();
              }}
              className="h-7 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {recentNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <Bell className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[400px]">
              <div className="py-1">
                {recentNotifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`flex items-start gap-3 p-3 cursor-pointer ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                      </div>
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
            </ScrollArea>

            {/* Footer - Always show "View All" link */}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-sm font-medium cursor-pointer"
              onClick={() => navigate('/notifications')}
            >
              View all notifications
              <ArrowRight className="h-4 w-4 ml-2" />
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
