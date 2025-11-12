import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { Capacitor } from '@capacitor/core';

interface SyncStatusProps {
  isEnabled: boolean;
  isSyncing: boolean;
  className?: string;
}

/**
 * Visual indicator for background sync status
 * Shows on mobile to indicate auto-sync is active
 */
export const SyncStatus: React.FC<SyncStatusProps> = ({
  isEnabled,
  isSyncing,
  className = ""
}) => {
  const isOnline = useConnectionStatus();
  const [showPulse, setShowPulse] = useState(false);
  const isMobile = Capacitor.isNativePlatform() || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Don't show on desktop
  if (!isMobile) return null;

  // Show pulse animation when syncing
  useEffect(() => {
    if (isSyncing && isOnline) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSyncing, isOnline]);

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className="h-3 w-3 text-red-500" />;
    }
    
    if (showPulse) {
      return <RefreshCw className="h-3 w-3 text-green-500 animate-spin" />;
    }
    
    return <Wifi className="h-3 w-3 text-green-500" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (showPulse) return 'Syncing...';
    return 'Auto-sync';
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {getStatusIcon()}
      <span className="text-xs text-muted-foreground">
        {getStatusText()}
      </span>
      {isEnabled && isOnline && (
        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
      )}
    </div>
  );
};
