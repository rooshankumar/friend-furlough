import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';

interface UserAvatarProps {
  user?: {
    id?: string;
    user_metadata?: {
      name?: string;
      avatar_url?: string;
    };
    email?: string;
  } | null;
  profile?: {
    name?: string;
    avatar_url?: string;
  } | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackClassName?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = React.memo(({ 
  user, 
  profile, 
  size = 'md', 
  className = '',
  fallbackClassName = ''
}) => {
  // Determine the best avatar source with priority:
  // 1. Profile avatar_url (from profiles table - user uploaded)
  // 2. User metadata avatar_url (from auth - Google/OAuth)
  // 3. Fallback to initials
  const getAvatarUrl = () => {
    if (profile?.avatar_url) return profile.avatar_url;
    if (user?.user_metadata?.avatar_url) return user.user_metadata.avatar_url;
    return null;
  };

  // Get display name with priority:
  // 1. Profile name (from profiles table)
  // 2. User metadata name (from auth)
  // 3. Email
  const getDisplayName = () => {
    if (profile?.name) return profile.name;
    if (user?.user_metadata?.name) return user.user_metadata.name;
    if (user?.email) return user.email;
    return 'User';
  };

  // Get initials for fallback
  const getInitials = () => {
    const name = getDisplayName();
    if (name === 'User') return 'U';
    
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0]?.toUpperCase() || 'U';
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base'
  };

  const avatarUrl = getAvatarUrl();
  const initials = getInitials();

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {avatarUrl && (
        <AvatarImage 
          src={avatarUrl} 
          alt={getDisplayName()}
          className="object-cover"
        />
      )}
      <AvatarFallback 
        className={`bg-gradient-cultural text-white ${textSizeClasses[size]} ${fallbackClassName}`}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
});

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar;
