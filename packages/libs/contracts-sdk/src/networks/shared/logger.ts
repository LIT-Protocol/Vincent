/**
 * A unified logging interface that uses:
 * - Lit Protocol Logger for browser environments
 * - Pino for Node.js environments
 */

import { LogManager, Logger } from '@lit-protocol/logger';
// Environment detection
const isBrowser = typeof window !== 'undefined';

const DEFAULT_CATEGORY = '[Vincent Contracts]';

let logger: {
  info: (message: any, ...args: any[]) => void;
  error: (message: any, ...args: any[]) => void;
  warn: (message: any, ...args: any[]) => void;
  debug: (message: any, ...args: any[]) => void;
  trace: (message: any, ...args: any[]) => void;
  child: (bindings: object) => Logger;
};

// ================================================
// For browser environments, use the Lit Logger
// ================================================
if (isBrowser) {
  LogManager.Instance.setPrefix(DEFAULT_CATEGORY);

  // @ts-ignore - child method is not present in the Logger type
  logger = LogManager.Instance.get();
}
// ================================================
// For Node.js environments, use Pino
// ================================================
else {
  const pino = require('pino');

  logger = pino({
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: true },
    },
    base: { app: DEFAULT_CATEGORY },
  });
}

export { logger };
