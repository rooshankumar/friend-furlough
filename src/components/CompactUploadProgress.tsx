import React from 'react';

interface CompactUploadProgressProps {
  progress: number; // 0-100
  size?: number; // Size in pixels (default: 40)
  strokeWidth?: number; // Stroke width (default: 3)
  showPercentage?: boolean; // Show percentage text (default: true)
  className?: string;
}

/**
 * Compact circular upload progress indicator
 * Shows percentage from 0-100 with a circular progress ring
 * 
 * @example
 * // Default 40px size
 * <CompactUploadProgress progress={50} />
 * 
 * @example
 * // Custom size
 * <CompactUploadProgress progress={75} size={48} />
 * 
 * @example
 * // No percentage text
 * <CompactUploadProgress progress={30} showPercentage={false} />
 */
export const CompactUploadProgress: React.FC<CompactUploadProgressProps> = ({ 
  progress, 
  size = 40,
  strokeWidth = 3,
  showPercentage = true,
  className = ''
}) => {
  // Calculate circle properties
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  // Calculate font size based on size
  const fontSize = Math.max(8, Math.floor(size / 5));

  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Background circle */}
      <svg
        className="absolute transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-white opacity-20"
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-white transition-all duration-300 ease-out"
        />
      </svg>
      
      {/* Percentage text */}
      {showPercentage && (
        <span 
          className="absolute font-semibold text-white"
          style={{ fontSize: `${fontSize}px` }}
        >
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
};

interface UploadProgressOverlayProps {
  progress: number;
  size?: number;
  showPercentage?: boolean;
  className?: string;
}

/**
 * Upload progress overlay with backdrop blur
 * Wraps CompactUploadProgress with a semi-transparent overlay
 * 
 * @example
 * <div className="relative">
 *   <img src="..." />
 *   {isUploading && progress < 100 && (
 *     <UploadProgressOverlay progress={progress} />
 *   )}
 * </div>
 */
export const UploadProgressOverlay: React.FC<UploadProgressOverlayProps> = ({
  progress,
  size = 40,
  showPercentage = true,
  className = ''
}) => {
  return (
    <div className={`absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center backdrop-blur-sm ${className}`}>
      <CompactUploadProgress 
        progress={progress} 
        size={size}
        showPercentage={showPercentage}
      />
    </div>
  );
};

interface UploadProgressBadgeProps {
  progress: number;
  size?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  showPercentage?: boolean;
}

/**
 * Upload progress badge that can be positioned on an image
 * Useful for showing progress without covering the entire image
 * 
 * @example
 * <div className="relative">
 *   <img src="..." />
 *   {isUploading && progress < 100 && (
 *     <UploadProgressBadge progress={progress} position="top-right" />
 *   )}
 * </div>
 */
export const UploadProgressBadge: React.FC<UploadProgressBadgeProps> = ({
  progress,
  size = 32,
  position = 'top-right',
  showPercentage = true
}) => {
  const positionClasses = {
    'top-right': 'top-2 right-2',
    'top-left': 'top-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
  };

  return (
    <div className={`absolute ${positionClasses[position]} bg-black/60 rounded-full p-1 backdrop-blur-sm`}>
      <CompactUploadProgress 
        progress={progress} 
        size={size}
        showPercentage={showPercentage}
      />
    </div>
  );
};

export default CompactUploadProgress;
