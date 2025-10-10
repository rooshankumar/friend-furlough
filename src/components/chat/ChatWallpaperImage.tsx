import React from 'react';

export type WallpaperPosition =
  | 'center'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'left top'
  | 'left center'
  | 'left bottom'
  | 'right top'
  | 'right center'
  | 'right bottom';

interface ChatWallpaperImageProps {
  className?: string;
  imageUrl?: string;      // e.g. /wallpapers/roshlingua-chat.png (place under /public)
  position?: WallpaperPosition;
  dim?: number;           // 0..1 overlay to improve contrast
  blurPx?: number;        // optional blur in px
}

export const ChatWallpaperImage: React.FC<ChatWallpaperImageProps> = ({
  className = '',
  imageUrl = '/wallpapers/chat-wallpaper.png',
  position = 'center',
  dim = 0.06,
  blurPx = 0,
}) => {
  return (
    <div className={`absolute inset-0 -z-10 pointer-events-none ${className}`} aria-hidden="true">
      <img
        src={imageUrl}
        alt=""
        className="w-full h-full object-cover select-none"
        style={{ objectPosition: position as any, filter: blurPx ? `blur(${blurPx}px)` : undefined }}
        draggable={false}
      />
      {/* Light overlay to keep messages readable on busy wallpapers */}
      <div className="absolute inset-0" style={{ backgroundColor: `rgba(255,255,255,${dim})` }} />
      {/* Bottom fade so input area stands out */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background/60 to-transparent" />
    </div>
  );
};

export default ChatWallpaperImage;
