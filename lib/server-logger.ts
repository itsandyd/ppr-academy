/**
 * Server-side logger utility for production-safe logging
 * Used in API routes and server actions
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugEnabled = process.env.DEBUG === 'true';
const logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (isDevelopment ? 'debug' : 'warn');

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[logLevel];
}

function formatMessage(prefix: string, ...args: unknown[]): unknown[] {
  const timestamp = new Date().toISOString();
  return [`[${timestamp}] ${prefix}`, ...args];
}

/**
 * Server-side logger with environment-aware logging
 * - In development: all logs are shown
 * - In production: only warn and error logs are shown (unless DEBUG=true)
 */
export const serverLogger = {
  /**
   * Debug level - only shown in development
   */
  debug: (prefix: string, ...args: unknown[]): void => {
    if (shouldLog('debug') || isDebugEnabled) {
      console.log(...formatMessage(`[DEBUG] ${prefix}`, ...args));
    }
  },

  /**
   * Info level - shown in development, hidden in production by default
   */
  info: (prefix: string, ...args: unknown[]): void => {
    if (shouldLog('info') || isDebugEnabled) {
      console.info(...formatMessage(`[INFO] ${prefix}`, ...args));
    }
  },

  /**
   * Warn level - always shown
   */
  warn: (prefix: string, ...args: unknown[]): void => {
    if (shouldLog('warn')) {
      console.warn(...formatMessage(`[WARN] ${prefix}`, ...args));
    }
  },

  /**
   * Error level - always shown
   */
  error: (prefix: string, ...args: unknown[]): void => {
    console.error(...formatMessage(`[ERROR] ${prefix}`, ...args));
  },

  /**
   * Payment/financial operation logging - important for debugging payment issues
   * Shows in development, hidden in production unless DEBUG=true
   */
  payment: (prefix: string, data: Record<string, unknown>): void => {
    if (isDevelopment || isDebugEnabled) {
      // In dev/debug, show full details
      console.log(...formatMessage(`[PAYMENT] ${prefix}`, data));
    } else if (process.env.LOG_PAYMENTS === 'true') {
      // In production with LOG_PAYMENTS, show minimal safe info
      const safeData = {
        id: data.id,
        type: data.type,
        status: data.status,
        amount: data.amount,
        currency: data.currency,
        timestamp: new Date().toISOString(),
      };
      console.log(...formatMessage(`[PAYMENT] ${prefix}`, safeData));
    }
  },

  /**
   * Webhook event logging
   */
  webhook: (prefix: string, data: Record<string, unknown>): void => {
    if (isDevelopment || isDebugEnabled) {
      console.log(...formatMessage(`[WEBHOOK] ${prefix}`, data));
    }
  },
};

export default serverLogger;
