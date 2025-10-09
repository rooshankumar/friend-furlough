import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { Button } from '@/components/ui/button';

export const ConnectionStatus: React.FC = () => {
  const { isOnline, isReconnecting, forceReconnect } = useConnectionStatus();

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
