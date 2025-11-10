import { Button } from "@/components/ui/button";
import { Globe, MessageCircle, Users, User, Search, LogOut, Settings, Bell, Calendar, UserPlus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useChatStore } from "@/stores/chatStore";
import { useEffect, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import roshLinguaLogo from "@/assets/roshlingua-logo.png";
import { registerPushNotifications } from "@/lib/push";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, signOut } = useAuthStore();
  const { notifications, unreadCount, loadNotifications, markAsRead, markAllAsRead, subscribeToNotifications, unsubscribe } = useNotificationStore();
  const { conversations, loadConversations } = useChatStore();

  const isActive = (path: string) => location.pathname === path;
  
  // Check if we're on a specific chat conversation page (not just /chat)
  const isInChatConversation = location.pathname.startsWith('/chat/') && location.pathname !== '/chat';
  
  // Calculate total unread messages from all conversations
  const totalUnreadMessages = useMemo(() => {
    return conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
  }, [conversations]);

  // Load notifications and conversations when user is authenticated
  useEffect(() => {
    if (user?.id) {
      loadNotifications(user.id);
      subscribeToNotifications(user.id);
      // Register Web Push (non-blocking)
      registerPushNotifications(user.id).catch(() => {});
      
      // Load conversations for unread count
      if (conversations.length === 0) {
        loadConversations(user.id);
      }
      
      return () => {
        unsubscribe();
      };
    }
  }, [user?.id]);

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <>
      {/* Desktop Sidebar Navigation - Left */}
      {isAuthenticated && user && (
        <nav className="hidden md:flex fixed left-0 top-0 h-screen w-16 border-r border-border/50 bg-card/50 backdrop-blur-sm z-50 flex-col items-center py-4">
          {/* Logo */}
          <Link to="/" className="mb-8 group">
            <img 
              src={roshLinguaLogo} 
              alt="roshLingua" 
              className="h-10 w-10 transition-transform group-hover:scale-110"
            />
          </Link>

          {/* Navigation Links */}
          <div className="flex-1 flex flex-col items-center space-y-4">
            <Button
              variant={isActive("/explore") ? "cultural" : "ghost"}
              size="icon"
              asChild
              className="relative group"
            >
              <Link to="/explore">
                <Search className="h-5 w-5" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Explore
                </span>
              </Link>
            </Button>

            <Button
              variant={isActive("/chat") ? "cultural" : "ghost"}
              size="icon"
              asChild
              className="relative group"
            >
              <Link to="/chat" className="relative inline-flex">
                <MessageCircle className="h-5 w-5" />
                {totalUnreadMessages > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white shadow-sm">
                    {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                  </span>
                )}
                <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Chat {totalUnreadMessages > 0 && `(${totalUnreadMessages})`}
                </span>
              </Link>
            </Button>

            <Button
              variant={isActive("/community") ? "cultural" : "ghost"}
              size="icon"
              asChild
              className="relative group"
            >
              <Link to="/community">
                <Users className="h-5 w-5" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Community
                </span>
              </Link>
            </Button>

            <Button
              variant={isActive("/friends") ? "cultural" : "ghost"}
              size="icon"
              asChild
              className="relative group"
            >
              <Link to="/friends">
                <UserPlus className="h-5 w-5" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Friends
                </span>
              </Link>
            </Button>

            <Button
              variant={isActive("/events") ? "cultural" : "ghost"}
              size="icon"
              asChild
              className="relative group"
            >
              <Link to="/events">
                <Calendar className="h-5 w-5" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Events
                </span>
              </Link>
            </Button>

            <Button
              variant={isActive("/notifications") ? "cultural" : "ghost"}
              size="icon"
              asChild
              className="relative group"
            >
              <Link to="/notifications" className="relative inline-flex">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </span>
              </Link>
            </Button>

            <Button
              variant={isActive("/profile") ? "cultural" : "ghost"}
              size="icon"
              asChild
              className="relative group"
            >
              <Link to="/profile">
                <User className="h-5 w-5" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Profile
                </span>
              </Link>
            </Button>

            <Button
              variant={isActive("/settings") ? "cultural" : "ghost"}
              size="icon"
              asChild
              className="relative group"
            >
              <Link to="/settings">
                <Settings className="h-5 w-5" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Settings
                </span>
              </Link>
            </Button>
          </div>

          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative group">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
                <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Notifications
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right" className="w-80 bg-card z-50">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-6 text-xs">
                    Mark all read
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-[400px]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className={`flex flex-col items-start p-3 cursor-pointer ${
                          !notification.read ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start justify-between w-full">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{notification.title}</p>
                            {notification.message && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full ml-2" />
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Avatar at Bottom */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="mt-auto">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-gradient-cultural text-white text-xs">
                    {profile?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right" className="w-56 bg-card z-50">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      )}

      {/* Mobile Top Navigation - Only for unauthenticated users */}
      {!isAuthenticated && (
        <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center space-x-3 group">
                <img 
                  src={roshLinguaLogo} 
                  alt="roshLingua" 
                  className="h-10 w-10 transition-transform group-hover:scale-110"
                />
                <span className="text-xl font-bold text-cultural-gradient">
                  roshLingua
                </span>
              </Link>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/auth/signin">Sign In</Link>
                </Button>
                <Button variant="cultural" size="sm" asChild>
                  <Link to="/auth/signup">Join Community</Link>
                </Button>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Mobile Navigation - Bottom */}
      {isAuthenticated && user && !isInChatConversation && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-sm">
          <div className="flex items-center justify-around py-2 px-2">
            <Button
              variant={isActive("/explore") ? "cultural" : "ghost"}
              size="sm"
              asChild
              className="flex-1 mx-1 hover:bg-accent/50 active:bg-accent/70 transition-colors"
            >
              <Link to="/explore" className="flex flex-col items-center space-y-1 py-2">
                <Search className="h-5 w-5" />
                <span className="text-xs">Explore</span>
              </Link>
            </Button>

            <Button
              variant={isActive("/chat") ? "cultural" : "ghost"}
              size="sm"
              asChild
              className="flex-1 mx-1 hover:bg-accent/50 active:bg-accent/70 transition-colors relative"
            >
              <Link to="/chat" className="flex flex-col items-center space-y-1 py-2">
                <div className="relative inline-flex">
                  <MessageCircle className="h-5 w-5" />
                  {totalUnreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-semibold text-white shadow-sm">
                      {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                    </span>
                  )}
                </div>
                <span className="text-xs">Chat</span>
              </Link>
            </Button>

            <Button
              variant={isActive("/community") ? "cultural" : "ghost"}
              size="sm"
              asChild
              className="flex-1 mx-1 hover:bg-accent/50 active:bg-accent/70 transition-colors"
            >
              <Link to="/community" className="flex flex-col items-center space-y-1 py-2">
                <Users className="h-5 w-5" />
                <span className="text-xs">Community</span>
              </Link>
            </Button>

            <Button
              variant={isActive("/profile") ? "cultural" : "ghost"}
              size="sm"
              asChild
              className="flex-1 mx-1 hover:bg-accent/50 active:bg-accent/70 transition-colors"
            >
              <Link to="/profile" className="flex flex-col items-center space-y-1 py-2">
                <User className="h-5 w-5" />
                <span className="text-xs">Profile</span>
              </Link>
            </Button>

            <Button
              variant={isActive("/notifications") ? "cultural" : "ghost"}
              size="sm"
              asChild
              className="flex-1 mx-1 hover:bg-accent/50 active:bg-accent/70 transition-colors relative"
            >
              <Link to="/notifications" className="flex flex-col items-center space-y-1 py-2">
                <div className="relative inline-flex">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-semibold text-white shadow-sm">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-xs">Notifications</span>
              </Link>
            </Button>
          </div>
        </nav>
      )}
    </>
  );
};

export default Navigation;
