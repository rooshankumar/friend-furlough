import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const ConnectionStatus: React.FC = () => {
  const { isOnline, isReconnecting, forceReconnect } = useConnectionStatus();
  const [wasOffline, setWasOffline] = useState(false);
  const [showUnstableWarning, setShowUnstableWarning] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Detect mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Track connection stability
  useEffect(() => {
    if (!isOnline && !wasOffline) {
      setWasOffline(true);
      setReconnectAttempts(prev => prev + 1);
      
      // Show compact toast on mobile for unstable connection
      if (isMobile && reconnectAttempts > 0) {
        toast.warning('Network unstable', {
          description: 'Trying to reconnect...',
          duration: 2000,
        });
      }
    } else if (isOnline && wasOffline) {
      setWasOffline(false);
      
      // Show success toast on mobile
      if (isMobile) {
        toast.success('Back online', {
          duration: 2000,
        });
      }
      
      // Reset attempts after successful reconnection
      setTimeout(() => setReconnectAttempts(0), 5000);
    }

    // Show unstable warning if multiple reconnects
    if (reconnectAttempts >= 3 && !showUnstableWarning) {
      setShowUnstableWarning(true);
      if (isMobile) {
        toast.error('Connection unstable', {
          description: 'Please check your internet',
          duration: 3000,
        });
      }
      setTimeout(() => setShowUnstableWarning(false), 10000);
    }
  }, [isOnline, wasOffline, reconnectAttempts, showUnstableWarning, isMobile]);

  // Show reconnecting status
  if (isReconnecting) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">Reconnecting...</span>
      </div>
    );
  }

  // Show offline status with reconnect button
  if (!isOnline) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">No internet connection</span>
        <Button
          onClick={forceReconnect}
          size="sm"
          variant="outline"
          className="h-6 px-2 text-xs bg-white text-red-500 hover:bg-gray-100 border-white"
        >
          Retry
        </Button>
      </div>
    );
  }

  return null;
};

export default ConnectionStatus;
