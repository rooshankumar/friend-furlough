import { useState, useEffect } from 'react';
import { connectionManager } from '@/lib/connectionManager';

export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(connectionManager.connected);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    // Listen for connection changes
    const unsubscribe = connectionManager.onConnectionChange((online) => {
      setIsOnline(online);
      
      if (online) {
        setIsReconnecting(false);
      }
    });

    // Listen for reconnection events
    const handleReconnecting = () => {
      setIsReconnecting(true);
      // Auto-hide reconnecting status after 3 seconds
      setTimeout(() => setIsReconnecting(false), 3000);
    };

    const handleReconnected = () => {
      setIsReconnecting(false);
    };

    window.addEventListener('supabase-reconnected', handleReconnected);
    
    // Listen for visibility changes to trigger reconnection status
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isOnline) {
        setIsReconnecting(true);
        // Check connection after becoming visible
        setTimeout(() => {
          connectionManager.checkConnection();
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribe();
      window.removeEventListener('supabase-reconnected', handleReconnected);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOnline]);

  return {
    isOnline,
    isReconnecting,
    forceReconnect: () => {
      setIsReconnecting(true);
      connectionManager.checkConnection();
    }
  };
};
