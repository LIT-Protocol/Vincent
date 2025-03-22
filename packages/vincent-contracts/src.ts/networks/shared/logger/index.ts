/**
 * A unified logging interface factory that creates:
 * - Custom Lit Protocol Logger for browser environments (with Vincent branding)
 * - Pino for Node.js environments
 */

import { BrowserLogger } from './BrowserLogger';

// Environment detection - handle both browser and Node.js environments safely
const isBrowser =
  typeof globalThis !== 'undefined' &&
  typeof globalThis.window !== 'undefined' &&
  globalThis.window === globalThis;

export interface LoggerOptions {
  level?: string;
  prefix?: string;
  colors?: {
    debug?: string;
    info?: string;
    warn?: string;
    error?: string;
    fatal?: string;
  };
  [key: string]: any;
}

/**
 * Creates a configured logger instance
 * @param category The category name for the logger
 * @param options Additional configuration options
 * @returns A configured logger instance
 */
export function createLogger(category: string, options: LoggerOptions = {}) {
  // ================================
  // Browser environment
  // ================================
  if (isBrowser) {
    return new BrowserLogger(category);
  }

  // ================================
  // Node.js environment - use Pino
  // ================================
  const pino = require('pino');

  return pino({
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: true },
    },
    base: { app: category },
    level: options.level || 'info',
    ...options,
  });
}

export const logger = createLogger('Vincent Contracts');
