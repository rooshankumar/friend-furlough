import React from 'react';
import { useConnectionStatus } from '@/hooks/usePerformanceOptimization';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { connectionManager } from '@/lib/connectionManager';

export const ConnectionStatus: React.FC = () => {
  const isOnline = useConnectionStatus();
  const [isReconnecting, setIsReconnecting] = React.useState(false);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await connectionManager.checkConnection();
    } finally {
      setIsReconnecting(false);
    }
  };

  if (isOnline) {
    return null; // Don't show anything when connected
  }

  return (
    <Alert className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 w-auto max-w-md bg-destructive text-destructive-foreground border-destructive">
      <WifiOff className="h-4 w-4" />
      <AlertDescription className="flex items-center gap-2">
        <span>Connection lost. Some features may not work.</span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleReconnect}
          disabled={isReconnecting}
          className="h-6 px-2 text-xs bg-transparent border-current text-current hover:bg-current hover:text-destructive"
        >
          {isReconnecting ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <>
              <Wifi className="h-3 w-3 mr-1" />
              Retry
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default ConnectionStatus;
