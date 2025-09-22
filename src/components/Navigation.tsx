import { Button } from "@/components/ui/button";
import { Globe, MessageCircle, Users, User, Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import roshLinguaLogo from "@/assets/roshlingua-logo.png";

const Navigation = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
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

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Button
              variant={isActive("/explore") ? "cultural" : "ghost"}
              size="sm"
              asChild
            >
              <Link to="/explore" className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Explore</span>
              </Link>
            </Button>

            <Button
              variant={isActive("/chat") ? "cultural" : "ghost"}
              size="sm"
              asChild
            >
              <Link to="/chat" className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4" />
                <span>Chat</span>
              </Link>
            </Button>

            <Button
              variant={isActive("/community") ? "cultural" : "ghost"}
              size="sm"
              asChild
            >
              <Link to="/community" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Community</span>
              </Link>
            </Button>

            <Button
              variant={isActive("/profile") ? "cultural" : "ghost"}
              size="sm"
              asChild
            >
              <Link to="/profile" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
            </Button>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/auth/signin">Sign In</Link>
            </Button>
            <Button variant="cultural" size="sm" asChild>
              <Link to="/auth/signup">Join Community</Link>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around pt-3 border-t border-border/30 mt-3">
          <Button
            variant={isActive("/explore") ? "cultural" : "ghost"}
            size="sm"
            asChild
          >
            <Link to="/explore" className="flex flex-col items-center space-y-1">
              <Search className="h-4 w-4" />
              <span className="text-xs">Explore</span>
            </Link>
          </Button>

          <Button
            variant={isActive("/chat") ? "cultural" : "ghost"}
            size="sm"
            asChild
          >
            <Link to="/chat" className="flex flex-col items-center space-y-1">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">Chat</span>
            </Link>
          </Button>

          <Button
            variant={isActive("/community") ? "cultural" : "ghost"}
            size="sm"
            asChild
          >
            <Link to="/community" className="flex flex-col items-center space-y-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Community</span>
            </Link>
          </Button>

          <Button
            variant={isActive("/profile") ? "cultural" : "ghost"}
            size="sm"
            asChild
          >
            <Link to="/profile" className="flex flex-col items-center space-y-1">
              <User className="h-4 w-4" />
              <span className="text-xs">Profile</span>
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;