import React from 'react';
import { useConnectionStatus } from '@/hooks/usePerformanceOptimization';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { connectionManager } from '@/lib/connectionManager';
import { useToast } from '@/hooks/use-toast';

export const ConnectionStatus: React.FC = () => {
  const isOnline = useConnectionStatus();
  const [isReconnecting, setIsReconnecting] = React.useState(false);
  const [reconnectAttempts, setReconnectAttempts] = React.useState(0);
  const [lastDisconnected, setLastDisconnected] = React.useState<Date | null>(null);
  const { toast } = useToast();

  // Track disconnection time
  React.useEffect(() => {
    if (!isOnline && !lastDisconnected) {
      setLastDisconnected(new Date());
    } else if (isOnline && lastDisconnected) {
      const reconnectTime = Date.now() - lastDisconnected.getTime();
      toast({
        title: "Connection restored!",
        description: `Reconnected after ${Math.round(reconnectTime / 1000)}s`,
        duration: 3000,
      });
      setLastDisconnected(null);
      setReconnectAttempts(0);
    }
  }, [isOnline, lastDisconnected, toast]);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    setReconnectAttempts(prev => prev + 1);
    
    try {
      console.log('🔄 Manual reconnection attempt', reconnectAttempts + 1);
      
      // Force multiple connection checks
      await connectionManager.checkConnection();
      
      // If still offline, try to refresh the page as last resort
      if (!connectionManager.connected && reconnectAttempts >= 2) {
        toast({
          title: "Refreshing page...",
          description: "Attempting to restore connection",
          duration: 2000,
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('Manual reconnection failed:', error);
      toast({
        title: "Reconnection failed",
        description: "Please check your internet connection",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsReconnecting(false);
    }
  };

  if (isOnline) {
    return null; // Don't show anything when connected
  }

  const disconnectedTime = lastDisconnected 
    ? Math.round((Date.now() - lastDisconnected.getTime()) / 1000)
    : 0;

  return (
    <>
      {/* Main connection alert */}
      <Alert className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 w-auto max-w-md bg-destructive text-destructive-foreground border-destructive shadow-lg">
        <WifiOff className="h-4 w-4" />
        <AlertDescription className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-medium">Connection lost</div>
              <div className="text-xs opacity-90">
                {disconnectedTime > 0 && `Offline for ${disconnectedTime}s`}
                {reconnectAttempts > 0 && ` • ${reconnectAttempts} attempts`}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="h-8 px-3 text-xs bg-transparent border-current text-current hover:bg-current hover:text-destructive"
            >
              {isReconnecting ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Wifi className="h-3 w-3 mr-1" />
                  {reconnectAttempts >= 2 ? 'Refresh Page' : 'Retry'}
                </>
              )}
            </Button>
          </div>
          
          {reconnectAttempts >= 1 && (
            <div className="flex items-center gap-1 text-xs opacity-75">
              <AlertTriangle className="h-3 w-3" />
              <span>Try refreshing if connection issues persist</span>
            </div>
          )}
        </AlertDescription>
      </Alert>
      
      {/* Bottom sticky indicator for mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-destructive text-destructive-foreground p-2 z-40">
        <div className="flex items-center justify-center gap-2 text-sm">
          <WifiOff className="h-4 w-4" />
          <span>Offline • Tap retry to reconnect</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReconnect}
            disabled={isReconnecting}
            className="h-6 px-2 text-xs text-current hover:bg-current/20"
          >
            {isReconnecting ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              'Retry'
            )}
          </Button>
        </div>
      </div>
    </>
  );
};

export default ConnectionStatus;
