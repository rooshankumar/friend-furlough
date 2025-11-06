import React from 'react';

interface UploadProgressProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Circular progress indicator for file uploads
 * Shows percentage from 1-100 in a small, detectable circle
 */
export const UploadProgress: React.FC<UploadProgressProps> = ({ 
  progress, 
  size = 'md' 
}) => {
  // Size configurations
  const sizeConfig = {
    sm: { 
      dimension: 32, 
      strokeWidth: 3, 
      fontSize: 'text-[8px]',
      radius: 13 
    },
    md: { 
      dimension: 48, 
      strokeWidth: 4, 
      fontSize: 'text-[10px]',
      radius: 20 
    },
    lg: { 
      dimension: 64, 
      strokeWidth: 5, 
      fontSize: 'text-xs',
      radius: 27 
    }
  };

  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * config.radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div 
      className="relative inline-flex items-center justify-center"
      style={{ width: config.dimension, height: config.dimension }}
    >
      {/* Background circle */}
      <svg
        className="absolute transform -rotate-90"
        width={config.dimension}
        height={config.dimension}
      >
        <circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={config.radius}
          stroke="currentColor"
          strokeWidth={config.strokeWidth}
          fill="none"
          className="text-muted opacity-20"
        />
        {/* Progress circle */}
        <circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={config.radius}
          stroke="currentColor"
          strokeWidth={config.strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-300 ease-out"
        />
      </svg>
      
      {/* Percentage text */}
      <span className={`absolute font-semibold ${config.fontSize} text-foreground`}>
        {Math.round(progress)}%
      </span>
    </div>
  );
};

/**
 * Compact upload progress for inline display
 * Very small and detectable
 */
export const CompactUploadProgress: React.FC<{ progress: number }> = ({ progress }) => {
  const radius = 10;
  const strokeWidth = 2.5;
  const dimension = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div 
      className="inline-flex items-center justify-center bg-background/80 rounded-full p-0.5 shadow-sm"
      style={{ width: dimension, height: dimension }}
    >
      <svg
        className="transform -rotate-90"
        width={dimension}
        height={dimension}
      >
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted opacity-20"
        />
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-200"
        />
      </svg>
      <span className="absolute text-[7px] font-bold text-foreground">
        {Math.round(progress)}
      </span>
    </div>
  );
};
