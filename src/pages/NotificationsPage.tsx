import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { groupNotifications } from '@/lib/notificationHelpers';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, MessageCircle, UserPlus, Heart, MessageSquare, Calendar, CheckCheck, Trash2, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ProfileVisitorCard from '@/components/ProfileVisitorCard';
import { supabase } from '@/integrations/supabase/client';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    notifications, 
    unreadCount, 
    isLoading,
    loadNotifications, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    subscribeToNotifications,
    unsubscribe
  } = useNotificationStore();

  const [profileVisitors, setProfileVisitors] = useState<any[]>([]);
  const [visitorsLoading, setVisitorsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user?.id) {
      loadNotifications(user.id);
      subscribeToNotifications(user.id);
      return () => unsubscribe();
    }
  }, [user?.id]);

  // Load profile visitors
  const loadProfileVisitors = async () => {
    if (!user?.id) return;
    
    setVisitorsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('profile_views')
        .select(`
          id,
          viewer_id,
          viewed_at,
          viewer:profiles!profile_views_viewer_id_fkey(
            id,
            name,
            avatar_url,
            country_flag,
            city,
            country
          )
        `)
        .eq('profile_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Group by viewer and count views
      const groupedVisitors = data?.reduce((acc: any[], view: any) => {
        const existing = acc.find(v => v.viewer_id === view.viewer_id);
        if (existing) {
          existing.view_count = (existing.view_count || 1) + 1;
          // Keep the most recent view time
          if (new Date(view.viewed_at) > new Date(existing.viewed_at)) {
            existing.viewed_at = view.viewed_at;
          }
        } else {
          acc.push({ ...view, view_count: 1 });
        }
        return acc;
      }, []) || [];

      setProfileVisitors(groupedVisitors);
    } catch (error) {
      console.error('Error loading profile visitors:', error);
    } finally {
      setVisitorsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'visitors') {
      loadProfileVisitors();
    }
  }, [activeTab, user?.id]);

  // Group notifications by type and related_id
  const groupedNotifications = useMemo(() => {
    return groupNotifications(notifications);
  }, [notifications]);

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
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'friend-request':
        return <UserPlus className="h-5 w-5 text-green-500" />;
      case 'friend-accepted':
        return <UserPlus className="h-5 w-5 text-green-500" />;
      case 'post-like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'post-comment':
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      case 'event-rsvp':
        return <Calendar className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-16">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              {unreadCount > 0 && activeTab === 'all' && (
                <p className="text-sm text-muted-foreground">
                  {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          {unreadCount > 0 && activeTab === 'all' && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="flex items-center gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              All Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="visitors" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Profile Visitors
              {profileVisitors.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {profileVisitors.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* All Notifications Tab */}
          <TabsContent value="all" className="mt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
            <p className="text-sm text-muted-foreground">
              When you get notifications, they'll show up here
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="space-y-2">
              {groupedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group relative flex items-start gap-3 p-4 rounded-lg border transition-all cursor-pointer hover:bg-accent/50 ${
                    notification.read 
                      ? 'bg-background border-border/50' 
                      : 'bg-primary/5 border-primary/20'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1 relative">
                    {getNotificationIcon(notification.type)}
                    {notification.grouped && notification.count > 1 && (
                      <Badge 
                        variant="secondary" 
                        className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[9px]"
                      >
                        {notification.count}
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">
                        {notification.title}
                      </p>
                    </div>
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

                  {/* Delete button (shows on hover) */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
          </TabsContent>

          {/* Profile Visitors Tab */}
          <TabsContent value="visitors" className="mt-4">
            {visitorsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : profileVisitors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Eye className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No profile visitors yet</h3>
                <p className="text-sm text-muted-foreground">
                  When someone views your profile, they'll show up here
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-240px)]">
                <div className="space-y-3">
                  {profileVisitors.map((visitor) => (
                    <ProfileVisitorCard key={visitor.id} visitor={visitor} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NotificationsPage;
