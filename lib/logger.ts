/**
 * Production-safe logger utility
 * Only logs in development environment unless explicitly enabled
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  prefix?: string;
  enabled?: boolean;
}

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugEnabled = process.env.DEBUG === 'true' || process.env.NEXT_PUBLIC_DEBUG === 'true';

class Logger {
  private prefix: string;
  private enabled: boolean;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix || '';
    this.enabled = options.enabled ?? (isDevelopment || isDebugEnabled);
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const prefix = this.prefix ? `[${this.prefix}]` : '';
    return `${timestamp} ${level.toUpperCase()} ${prefix} ${message}`;
  }

  debug(...args: unknown[]): void {
    if (this.enabled && isDevelopment) {
      console.log(this.formatMessage('debug', ''), ...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.enabled) {
      console.info(this.formatMessage('info', ''), ...args);
    }
  }

  warn(...args: unknown[]): void {
    // Warnings always show, but with less verbosity in production
    if (isDevelopment || isDebugEnabled) {
      console.warn(this.formatMessage('warn', ''), ...args);
    } else {
      console.warn(`[WARN] ${this.prefix}:`, args[0]);
    }
  }

  error(...args: unknown[]): void {
    // Errors always show
    console.error(this.formatMessage('error', ''), ...args);
  }

  /**
   * Only logs in development - for debugging purposes
   */
  devOnly(...args: unknown[]): void {
    if (isDevelopment) {
      console.log(`[DEV] ${this.prefix}:`, ...args);
    }
  }
}

// Default logger instance
export const logger = new Logger();

// Create a namespaced logger
export function createLogger(prefix: string, options?: Omit<LoggerOptions, 'prefix'>): Logger {
  return new Logger({ prefix, ...options });
}

// For backward compatibility - these are no-ops in production
export const devLog = (...args: unknown[]): void => {
  if (isDevelopment) {
    console.log('[DEV]', ...args);
  }
};

export const devWarn = (...args: unknown[]): void => {
  if (isDevelopment) {
    console.warn('[DEV WARN]', ...args);
  }
};

export const devError = (...args: unknown[]): void => {
  // Errors always log
  console.error('[ERROR]', ...args);
};

export default logger;
