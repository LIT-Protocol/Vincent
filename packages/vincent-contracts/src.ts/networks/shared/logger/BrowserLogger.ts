// @ts-nocheck
/**
 * Browser-specific logger implementation with colored output and callsite tracking
 * Provides logging functionality with Vincent branding for browser environments
 * Can be disabled by setting window.ENABLE_VINCENT_LOG = false
 */

export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

declare global {
  interface Window {
    ENABLE_VINCENT_LOG: boolean;
  }
}

// Default colors for different log levels
const DEFAULT_COLORS = {
  log: '#3498db', // Blue
  info: '#2ecc71', // Green
  warn: '#f39c12', // Orange
  error: '#e74c3c', // Red
  debug: '#9b59b6', // Purple
};

// Static color for namespace
const NAMESPACE_COLOR = '#f39c12'; // Orange

export class BrowserLogger {
  constructor(private namespace?: string) {}

  private logWithCallsite(level: LogLevel, ...args: unknown[]) {
    if (!globalThis.ENABLE_VINCENT_LOG) {
      return;
    }

    const err = new Error();
    const stackLines = err.stack?.split('\n') || [];
    const callsite =
      stackLines
        .slice(1)
        .find((line) => !line.includes('BrowserLogger'))
        ?.trim() ?? 'unknown';

    // Create colored prefix
    const namespaceStyle = `color: ${NAMESPACE_COLOR}; font-weight: bold`;
    const levelStyle = `color: ${DEFAULT_COLORS[level]}; font-weight: bold`;
    const callsiteStyle = 'color: grey';

    // Format the prefix with color styling
    const namespaceText = this.namespace ? `[${this.namespace}]` : '';
    const levelText = `[${level.toUpperCase()}]`;

    // First log the main message with colored prefix
    console[level](
      `%c${namespaceText} %c${levelText}`,
      namespaceStyle,
      levelStyle,
      ...args
    );

    // Then log the styled callsite on a new line
    console[level]('%c[trace] ' + callsite, callsiteStyle);
  }

  log(...args: unknown[]) {
    this.logWithCallsite('log', ...args);
  }

  info(...args: unknown[]) {
    this.logWithCallsite('info', ...args);
  }

  warn(...args: unknown[]) {
    this.logWithCallsite('warn', ...args);
  }

  error(...args: unknown[]) {
    this.logWithCallsite('error', ...args);
  }

  debug(...args: unknown[]) {
    this.logWithCallsite('debug', ...args);
  }
}
