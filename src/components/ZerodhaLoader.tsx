import React from 'react';

interface ZerodhaLoaderProps {
  size?: number;
  isDark?: boolean;
  visible?: boolean;
}

/**
 * Zerodha-style global loader
 * Thin-line circular spinner with subtle animation
 * - Perfect circle with thin stroke (~2px)
 * - Continuous linear rotation (1.2s per full rotation)
 * - Soft colors: #A0A0A0 (light mode), #D0D0D0 (dark mode)
 * - Fades in/out smoothly
 * - Never blocks UI with overlay
 */
export const ZerodhaLoader: React.FC<ZerodhaLoaderProps> = ({
  size = 24,
  isDark = false,
  visible = true,
}) => {
  if (!visible) return null;

  const spinnerColor = isDark ? '#D0D0D0' : '#A0A0A0';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 200ms ease-in-out',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin"
        style={{
          animationDuration: '1.2s',
          animationTimingFunction: 'linear',
        }}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={spinnerColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="62.83"
          strokeDashoffset="0"
          opacity="0.8"
        />
      </svg>
    </div>
  );
};

export default ZerodhaLoader;
