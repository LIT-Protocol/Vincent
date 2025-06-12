// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { wrapLitActionAndComputeHash } from './plugins/wrapLitActionAndComputeHash';
import { aliasFetchCrossFetchPlugin } from './plugins/aliasCrossFetch';
import { getPolyfillNodePlugin } from './plugins/polyfillNode';

export const baseConfig = {
  tsconfig: './tsconfig.lib.json',
  entryPoints: ['./src/lib/lit-action.ts'],
  bundle: true,
  minify: true,
  sourcemap: false,
  treeShaking: true,
  outdir: './src/generated/',
  // external: ['ethers'], // FIXME: `dynamic require of ethers not allowed`
  platform: 'browser',
};

export function getDefaultActionBuildConfig(overrides = {}) {
  const { esbuildOverrides = {}, polyfillOverrides = {} } = overrides;

  return {
    ...baseConfig,
    ...{
      plugins: [
        aliasFetchCrossFetchPlugin(),
        wrapLitActionAndComputeHash,
        getPolyfillNodePlugin(polyfillOverrides),
      ],
    },
    ...esbuildOverrides,
  };
}
