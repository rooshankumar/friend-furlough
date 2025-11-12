/**
 * Production-safe logging utility
 * Replaces console.log statements with conditional logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  enabled: boolean;
  level: LogLevel;
  includeTimestamp: boolean;
  includeLocation: boolean;
}

class Logger {
  private config: LogConfig;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
    this.config = {
      enabled: this.isDevelopment,
      level: this.isDevelopment ? 'debug' : 'error',
      includeTimestamp: true,
      includeLocation: this.isDevelopment,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    
    return levels[level] >= levels[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string, location?: string): string {
    let formatted = message;
    
    if (this.config.includeTimestamp) {
      const timestamp = new Date().toISOString();
      formatted = `[${timestamp}] ${formatted}`;
    }
    
    if (this.config.includeLocation && location) {
      formatted = `${formatted} (${location})`;
    }
    
    return formatted;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', `🐛 ${message}`), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', `ℹ️ ${message}`), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', `⚠️ ${message}`), ...args);
    }
  }

  error(message: string, error?: any, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', `❌ ${message}`), error, ...args);
    }
  }

  // Performance logging for mobile optimization
  performance(label: string, startTime?: number): void {
    if (this.isDevelopment) {
      if (startTime) {
        const duration = performance.now() - startTime;
        console.log(`⚡ ${label}: ${duration.toFixed(2)}ms`);
      } else {
        console.time(label);
      }
    }
  }

  // Mobile-specific logging
  mobile(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`📱 [MOBILE] ${message}`, ...args);
    }
  }

  // Network logging for debugging mobile issues
  network(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`🌐 [NETWORK] ${message}`, ...args);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports
export const { debug, info, warn, error, performance: logPerformance, mobile, network } = logger;

// Production-safe console replacement
export const safeConsole = {
  log: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
};
