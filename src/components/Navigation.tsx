import { Button } from "@/components/ui/button";
import { Globe, MessageCircle, Users, User, Search, LogOut, Settings } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/authStore";
import roshLinguaLogo from "@/assets/roshlingua-logo.png";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, signOut } = useAuthStore();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  return (
    <>
      {/* Desktop Sidebar Navigation - Left */}
      {isAuthenticated && (
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
              <Link to="/chat">
                <MessageCircle className="h-5 w-5" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Chat
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
          </div>

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
      {isAuthenticated && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-sm">
          <div className="flex items-center justify-around py-2 px-4">
            <Button
              variant={isActive("/explore") ? "cultural" : "ghost"}
              size="sm"
              asChild
              className="flex-1"
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
              className="flex-1"
            >
              <Link to="/chat" className="flex flex-col items-center space-y-1 py-2">
                <MessageCircle className="h-5 w-5" />
                <span className="text-xs">Chat</span>
              </Link>
            </Button>

            <Button
              variant={isActive("/community") ? "cultural" : "ghost"}
              size="sm"
              asChild
              className="flex-1"
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
              className="flex-1"
            >
              <Link to="/profile" className="flex flex-col items-center space-y-1 py-2">
                <User className="h-5 w-5" />
                <span className="text-xs">Profile</span>
              </Link>
            </Button>
          </div>
        </nav>
      )}
    </>
  );
};

export default Navigation;
