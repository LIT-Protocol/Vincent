// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import path from 'path';

export function aliasFetchCrossFetchPlugin() {
  const shim = path.resolve(__dirname, 'deno-fetch-shim.js');

  return {
    name: 'alias-fetch',
    setup(build) {
      // node-fetch root
      build.onResolve({ filter: /^node-fetch$/ }, () => ({ path: shim }));

      // any cross-fetch entry: "cross-fetch", "cross-fetch/…"
      build.onResolve({ filter: /^cross-fetch(\/.*)?$/ }, () => ({ path: shim }));
    },
  };
}
