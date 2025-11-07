
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { X, Copy, Trash2 } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
}

export const MobileConsole: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Intercept console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    const addLog = (type: LogEntry['type'], args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setLogs(prev => [...prev.slice(-99), {
        timestamp: new Date().toLocaleTimeString(),
        type,
        message
      }]);
    };

    console.log = (...args) => {
      originalLog.apply(console, args);
      addLog('log', args);
    };

    console.error = (...args) => {
      originalError.apply(console, args);
      addLog('error', args);
    };

    console.warn = (...args) => {
      originalWarn.apply(console, args);
      addLog('warn', args);
    };

    console.info = (...args) => {
      originalInfo.apply(console, args);
      addLog('info', args);
    };

    // Shake to open console (mobile)
    let lastShake = 0;
    const handleMotion = (e: DeviceMotionEvent) => {
      const acceleration = e.accelerationIncludingGravity;
      if (!acceleration) return;

      const { x, y, z } = acceleration;
      const total = Math.abs(x || 0) + Math.abs(y || 0) + Math.abs(z || 0);

      if (total > 40 && Date.now() - lastShake > 500) {
        lastShake = Date.now();
        setShakeCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            setIsVisible(true);
            return 0;
          }
          return newCount;
        });
      }
    };

    window.addEventListener('devicemotion', handleMotion);

    // Reset shake count after 2 seconds
    const shakeTimer = setInterval(() => {
      setShakeCount(0);
    }, 2000);

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
      window.removeEventListener('devicemotion', handleMotion);
      clearInterval(shakeTimer);
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const copyLogs = () => {
    const text = logs.map(log => `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`).join('\n');
    navigator.clipboard.writeText(text);
    console.log('✅ Logs copied to clipboard');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-20 right-4 z-[9999] rounded-full w-12 h-12 shadow-lg"
        variant="secondary"
      >
        🐛
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-[9999] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h2 className="text-lg font-bold">Mobile Console</h2>
        <div className="flex gap-2">
          <Button onClick={copyLogs} size="sm" variant="ghost">
            <Copy className="w-4 h-4" />
          </Button>
          <Button onClick={clearLogs} size="sm" variant="ghost">
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button onClick={() => setIsVisible(false)} size="sm" variant="ghost">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="text-muted-foreground text-center mt-10">
            No logs yet. Shake device 3 times to toggle console.
          </div>
        ) : (
          logs.map((log, idx) => (
            <div
              key={idx}
              className={`mb-2 p-2 rounded ${
                log.type === 'error' ? 'bg-red-500/10 text-red-400' :
                log.type === 'warn' ? 'bg-yellow-500/10 text-yellow-400' :
                log.type === 'info' ? 'bg-blue-500/10 text-blue-400' :
                'bg-muted/50 text-foreground'
              }`}
            >
              <div className="text-muted-foreground text-[10px] mb-1">
                [{log.timestamp}] {log.type.toUpperCase()}
              </div>
              <div className="whitespace-pre-wrap break-words">
                {log.message}
              </div>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-border text-xs text-muted-foreground text-center">
        {logs.length} logs • Shake 3x to toggle
      </div>
    </div>
  );
};
