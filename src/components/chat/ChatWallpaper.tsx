import React from 'react';

interface ChatWallpaperProps {
  className?: string;
}

export const ChatWallpaper: React.FC<ChatWallpaperProps> = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 opacity-30" />
      
      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="chat-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="currentColor" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#chat-pattern)" />
        </svg>
      </div>

      {/* Penguin Illustration - Centered */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative opacity-20 scale-75 md:scale-100">
          <svg
            width="200"
            height="200"
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
          >
            {/* Penguin Body */}
            <ellipse cx="200" cy="250" rx="80" ry="100" fill="currentColor" opacity="0.8" />
            
            {/* Penguin Belly */}
            <ellipse cx="200" cy="250" rx="50" ry="70" fill="white" opacity="0.9" />
            
            {/* Penguin Head */}
            <circle cx="200" cy="150" r="60" fill="currentColor" opacity="0.8" />
            
            {/* Penguin Beak */}
            <polygon points="200,150 220,160 200,170" fill="#FFA500" opacity="0.8" />
            
            {/* Penguin Eyes */}
            <circle cx="185" cy="140" r="8" fill="white" />
            <circle cx="215" cy="140" r="8" fill="white" />
            <circle cx="185" cy="140" r="4" fill="black" />
            <circle cx="215" cy="140" r="4" fill="black" />
            
            {/* Winter Hat */}
            <path
              d="M140 120 Q140 100 160 100 L240 100 Q260 100 260 120 L260 130 Q260 140 250 140 L150 140 Q140 140 140 130 Z"
              fill="#DC2626"
              opacity="0.8"
            />
            
            {/* Hat Pom Pom */}
            <circle cx="200" cy="90" r="15" fill="white" opacity="0.9" />
            
            {/* Hat Brim */}
            <ellipse cx="200" cy="140" rx="65" ry="8" fill="#B91C1C" opacity="0.8" />
            
            {/* Scarf */}
            <rect x="170" y="200" width="60" height="15" rx="7" fill="#DC2626" opacity="0.8" />
            <rect x="260" y="205" width="40" height="10" rx="5" fill="#DC2626" opacity="0.8" />
            
            {/* Scarf Fringe */}
            <rect x="300" y="210" width="3" height="15" fill="#DC2626" opacity="0.6" />
            <rect x="305" y="210" width="3" height="12" fill="#DC2626" opacity="0.6" />
            <rect x="310" y="210" width="3" height="18" fill="#DC2626" opacity="0.6" />
            
            {/* Penguin Feet */}
            <ellipse cx="180" cy="350" rx="15" ry="8" fill="#FFA500" opacity="0.8" />
            <ellipse cx="220" cy="350" rx="15" ry="8" fill="#FFA500" opacity="0.8" />
            
            {/* Wings */}
            <ellipse cx="130" cy="230" rx="20" ry="50" fill="currentColor" opacity="0.7" transform="rotate(-20 130 230)" />
            <ellipse cx="270" cy="230" rx="20" ry="50" fill="currentColor" opacity="0.7" transform="rotate(20 270 230)" />
            
            {/* Speech Bubble */}
            <circle cx="320" cy="120" r="40" fill="white" opacity="0.9" stroke="currentColor" strokeWidth="2" />
            
            {/* Typing Dots in Speech Bubble */}
            <circle cx="305" cy="120" r="4" fill="currentColor" opacity="0.6">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" begin="0s" />
            </circle>
            <circle cx="320" cy="120" r="4" fill="currentColor" opacity="0.6">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
            </circle>
            <circle cx="335" cy="120" r="4" fill="currentColor" opacity="0.6">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" begin="1s" />
            </circle>
            
            {/* Speech Bubble Tail */}
            <polygon points="280,140 260,150 280,160" fill="white" opacity="0.9" />
            <polygon points="280,140 260,150 280,160" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          
          {/* Floating Hearts */}
          <div className="absolute -top-10 -right-10 animate-bounce">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-red-400 opacity-60">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
            </svg>
          </div>
          
          <div className="absolute -bottom-5 -left-8 animate-pulse">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-blue-400 opacity-40">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Subtle Snow Effect */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/20 to-transparent" />
    </div>
  );
};

export default ChatWallpaper;
