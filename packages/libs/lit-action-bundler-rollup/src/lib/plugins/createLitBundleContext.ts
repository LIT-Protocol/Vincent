// src/lib/plugins/createSharedContext.ts

import type { Plugin } from 'rollup';

import { initLitBundleContext } from '../litBundleContext';

/**
 * Various parts of the bundling lifecycle need access to the compiled raw LA handler code This
 * plugin creates a context on the RollupPlugin context using a unique symbol
 *
 * It must run before any plugin that requires access to the compiled LA code. See
 * `sharedContext.ts` for accessor functions.
 */
export function createLitBundleContext(): Plugin {
  return {
    buildStart() {
      initLitBundleContext(this);
    },
    name: 'lit-shared-ctx-init',
  };
}
