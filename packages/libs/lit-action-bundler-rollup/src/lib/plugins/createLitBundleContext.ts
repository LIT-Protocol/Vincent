// src/lib/plugins/createSharedContext.ts

import type { Plugin } from 'rollup';

export interface LitBundleContext {
  chunkFileNames: Record<string, string>;
  chunkIds: Record<string, string>;
}

const contextName = 'lit-bundler-context';
/**
 * Various parts of the bundling lifecycle need access to the compiled raw LA handler code This
 * plugin creates a context on the RollupPlugin context using a unique symbol
 *
 * It must run before any plugin that requires access to the compiled LA code. See
 * `sharedContext.ts` for accessor functions.
 */
export function createLitBundleContext(): Plugin {
  const litBundleContext = {
    chunkFileNames: {},
    chunkIds: {},
  } satisfies LitBundleContext;

  return {
    api: {
      getLitBundleContext: () => litBundleContext,
    },
    buildStart() {
      console.log('BUILDSTART - createLitBundleContext');
    },
    name: contextName,
  };
}
export function getLitBundleContext(plugins: Plugin[]): LitBundleContext {
  const parentName = contextName;
  const parentPlugin = plugins.find((plugin) => {
    console.log('checking', plugin.name, parentName, plugin.name === parentName);
    return plugin.name === parentName;
  });

  console.log(plugins, parentPlugin);
  if (!parentPlugin) {
    // or handle this silently if it is optional
    throw new Error(`This plugin depends on the "${parentName}" plugin.`);
  }
  // now you can access the API methods in subsequent hooks
  return parentPlugin.api.getLitBundleContext();
}
