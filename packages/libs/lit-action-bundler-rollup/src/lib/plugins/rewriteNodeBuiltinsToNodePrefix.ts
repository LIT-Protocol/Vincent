// src/lib/plugins/rewriteNodeBuiltinsToNodePrefix.ts

import type { Plugin } from 'rollup';

/**
 * LIT action Deno runtime exposes these as `node:<package>`, but packages that we depend on may try
 * to import them directly, without using the prefix. While this will work in NodeJS, it fails in
 * Deno.
 *
 * This plugin remaps the imports to be deno-safe, without using URL imports (which are not allowed
 * in LIT action runtime). It is used in lieu of using the Alias plugin with explicit shim files.
 *
 * ```typescript
 * // In code:
 * import crypto from 'crypto';
 *
 * // In bundle:
 * import crypto from 'node:crypto';
 * ```
 */

const builtins = new Set([
  'buffer',
  'crypto',
  'http',
  'https',
  'net',
  'os',
  'stream',
  'tty',
  'url',
  'util',
  'zlib',
]);

export function rewriteNodeBuiltinsToNodePrefix(): Plugin {
  return {
    name: 'rewrite-node-builtins-to-node-prefix',
    resolveId(source) {
      if (builtins.has(source)) return `node:${source}`;
      return null;
    },
  };
}
