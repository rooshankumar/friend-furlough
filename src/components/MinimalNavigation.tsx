import { Button } from "@/components/ui/button";
import { MessageCircle, Users, User, Search, Bell, Settings, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useChatStore } from "@/stores/chatStore";
import { useEffect, useMemo } from "react";
import roshLinguaLogo from "@/assets/roshlingua-logo.png";

const MinimalNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, signOut } = useAuthStore();
  const { unreadCount, loadNotifications, subscribeToNotifications } = useNotificationStore();
  const { conversations, loadConversations } = useChatStore();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path);
  
  // Calculate total unread messages
  const totalUnreadMessages = useMemo(() => {
    return conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
  }, [conversations]);

  // Load data when authenticated
  useEffect(() => {
    if (user?.id) {
      loadNotifications(user.id);
      subscribeToNotifications(user.id);
      if (conversations.length === 0) {
        loadConversations(user.id);
      }
    }
  }, [user?.id]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      // Unauthenticated Header
      <nav className="border-b border-border/50 bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3 group">
              <img 
                src={roshLinguaLogo} 
                alt="roshLingua" 
                className="h-8 w-8 transition-transform group-hover:scale-110"
              />
              <span className="text-lg font-bold text-cultural-gradient">
                roshLingua
              </span>
            </Link>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth/signin">Sign In</Link>
              </Button>
              <Button variant="cultural" size="sm" asChild>
                <Link to="/auth/signup">Join</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Desktop Sidebar - Minimal */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-16 bg-card/95 backdrop-blur-sm border-r border-border/50 z-40">
        <div className="flex flex-col items-center py-4 space-y-4 w-full">
          {/* Logo */}
          <Link to="/" className="group mb-2">
            <img 
              src={roshLinguaLogo} 
              alt="roshLingua" 
              className="h-10 w-10 transition-transform group-hover:scale-110"
            />
          </Link>

          {/* Essential Navigation */}
          <div className="flex flex-col space-y-2">
            {/* Explore */}
            <Button
              variant={isActive("/explore") ? "cultural" : "ghost"}
              size="icon"
              asChild
              className="relative group"
            >
              <Link to="/explore">
                <Search className="h-5 w-5" />
                <span className="absolute left-full ml-3 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  Explore
                </span>
              </Link>
            </Button>

            {/* Chat */}
            <Button
              variant={isActive("/chat") ? "cultural" : "ghost"}
              size="icon"
              asChild
              className="relative group"
            >
              <Link to="/chat" className="relative inline-flex">
                <MessageCircle className="h-5 w-5" />
                {totalUnreadMessages > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]">
                    {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                  </Badge>
                )}
                <span className="absolute left-full ml-3 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  Chat {totalUnreadMessages > 0 && `(${totalUnreadMessages})`}
                </span>
              </Link>
            </Button>

            {/* Community */}
            <Button
              variant={isActive("/community") ? "cultural" : "ghost"}
              size="icon"
              asChild
              className="relative group"
            >
              <Link to="/community">
                <Users className="h-5 w-5" />
                <span className="absolute left-full ml-3 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  Community
                </span>
              </Link>
            </Button>

            {/* Profile */}
            <Button
              variant={isActive("/profile") ? "cultural" : "ghost"}
              size="icon"
              asChild
              className="relative group"
            >
              <Link to="/profile">
                <User className="h-5 w-5" />
                <span className="absolute left-full ml-3 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  Profile
                </span>
              </Link>
            </Button>
          </div>

          {/* Bottom Section */}
          <div className="flex-1"></div>
          <div className="flex flex-col space-y-2">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative group">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
              <span className="absolute left-full ml-3 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Notifications
              </span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {profile?.name?.[0] || user?.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 ml-2">
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
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
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation - Essential Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-sm">
        <div className="flex items-center justify-around py-2 px-2">
          {/* Explore */}
          <Link 
            to="/explore" 
            className={`flex-1 mx-1 flex flex-col items-center space-y-1 py-2 px-2 rounded-md transition-colors touch-manipulation select-none ${
              isActive("/explore") 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50 active:bg-accent/70"
            }`}
          >
            <Search className="h-5 w-5" />
            <span className="text-xs font-medium">Explore</span>
          </Link>

          {/* Chat */}
          <Link 
            to="/chat" 
            className={`flex-1 mx-1 flex flex-col items-center space-y-1 py-2 px-2 rounded-md transition-colors touch-manipulation select-none relative ${
              isActive("/chat") 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50 active:bg-accent/70"
            }`}
          >
            <div className="relative inline-flex">
              <MessageCircle className="h-5 w-5" />
              {totalUnreadMessages > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[9px] bg-red-500 text-white">
                  {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                </Badge>
              )}
            </div>
            <span className="text-xs font-medium">Chat</span>
          </Link>

          {/* Community */}
          <Link 
            to="/community" 
            className={`flex-1 mx-1 flex flex-col items-center space-y-1 py-2 px-2 rounded-md transition-colors touch-manipulation select-none ${
              isActive("/community") 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50 active:bg-accent/70"
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs font-medium">Community</span>
          </Link>

          {/* Profile */}
          <Link 
            to="/profile" 
            className={`flex-1 mx-1 flex flex-col items-center space-y-1 py-2 px-2 rounded-md transition-colors touch-manipulation select-none ${
              isActive("/profile") 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50 active:bg-accent/70"
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-xs font-medium">Profile</span>
          </Link>

          {/* More Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex-1 mx-1 flex flex-col items-center space-y-1 py-2 px-2 rounded-md transition-colors touch-manipulation select-none text-muted-foreground hover:text-foreground hover:bg-accent/50 active:bg-accent/70 border-0 bg-transparent">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-[10px]">
                    {profile?.name?.[0] || user?.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium">More</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 mb-2">
              <DropdownMenuItem className="cursor-pointer">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
                {unreadCount > 0 && (
                  <Badge className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
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
        </div>
      </nav>
    </>
  );
};

export default MinimalNavigation;
