import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoiceMessagePlayerProps {
  audioUrl: string;
  isOwnMessage: boolean;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({ audioUrl, isOwnMessage }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [animationOffset, setAnimationOffset] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Animate waveform when playing
  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        setAnimationOffset(prev => (prev + 0.5) % 100);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate static waveform bars with progress
  const bars = useMemo(() => 
    Array.from({ length: 40 }, () => Math.random() * 16 + 8),
    []
  );
  
  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-sm ${
      isOwnMessage ? 'bg-[#0B93F6]' : 'bg-[#F0F0F0]'
    }`} style={{ minWidth: '240px', maxWidth: '280px' }}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
          isOwnMessage ? 'bg-white text-[#0B93F6]' : 'bg-primary text-white'
        } hover:scale-105`}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform */}
      <div className="flex-1 flex items-center gap-0.5 h-6">
        {bars.map((baseHeight, i) => {
          const barProgress = i / bars.length;
          const isActive = barProgress < progress;
          
          // Add wave animation when playing
          const animatedHeight = isPlaying 
            ? baseHeight + Math.sin((i + animationOffset) * 0.5) * 3
            : baseHeight;
          
          return (
            <div
              key={i}
              className={`w-0.5 rounded-full transition-all duration-100 ${
                isActive
                  ? isOwnMessage ? 'bg-white' : 'bg-primary'
                  : isOwnMessage ? 'bg-white/30' : 'bg-gray-300'
              }`}
              style={{ height: `${animatedHeight}px` }}
            />
          );
        })}
      </div>

      {/* Duration */}
      <span className={`text-xs font-medium flex-shrink-0 ${
        isOwnMessage ? 'text-white' : 'text-gray-700'
      }`}>
        {formatTime(currentTime || duration)}
      </span>
    </div>
  );
};
