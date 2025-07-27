import type { Plugin } from 'esbuild';

const DENO_FETCH_SHIM = './deno-fetch-shim.js';

export function aliasFetch(): Plugin {
  return {
    name: 'alias-fetch',
    setup(build) {
      build.onResolve({ filter: /^node-fetch$/ }, () => ({ path: DENO_FETCH_SHIM }));
      build.onResolve({ filter: /^cross-fetch(\/.*)?$/ }, () => ({ path: DENO_FETCH_SHIM }));
    },
  };
}
