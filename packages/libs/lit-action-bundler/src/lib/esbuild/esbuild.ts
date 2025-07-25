import type { BuildResult } from 'esbuild';

import path from 'path';

import { build } from 'esbuild';

import type { BuildLitActionOptions } from './types';

import { aliasFetch } from './plugins/aliasFetch';
import { createBundledFile } from './plugins/createBundledFile';
import { nodeBuiltinDenoShims } from './plugins/nodeBuiltinDenoShims';
import { wrapIIFEInStringPlugin } from './plugins/wrapIIFEInString';
import { assertOutputFiles } from './utils';

export function getCompatPluginCreators() {
  return {
    aliasFetch: aliasFetch,
    nodeBuiltinDenoShims: nodeBuiltinDenoShims,
    wrapIIFEInStringPlugin: wrapIIFEInStringPlugin,
    createBundledFile: createBundledFile,
  };
}

export const esbuildConfigDefaults = {
  bundle: true,
  minify: false,
  sourcemap: false,
  treeShaking: true,
  metafile: true,
  // inject: [path.resolve(__dirname, './plugins/node-global-shims.ts')],
  platform: 'browser' as const,
  write: false,
  external: ['node:*'],
};

/** Builds a Lit Action
 */
export async function buildLitAction({
  entryPoint,
  outdir,
  tsconfigPath,
  getLitActionHandler,
}: BuildLitActionOptions) {
  const sourceDir = path.dirname(entryPoint);

  const plugins = [aliasFetch(), await nodeBuiltinDenoShims(), await wrapIIFEInStringPlugin()];

  if (getLitActionHandler) {
    plugins.push(
      await createBundledFile({
        sourceDir: sourceDir,
        getLitActionHandler: getLitActionHandler,
      }),
    );
  }

  await build({
    outdir,
    tsconfig: tsconfigPath,
    entryPoints: [entryPoint],
    plugins,
    ...esbuildConfigDefaults,
  }).then((result: BuildResult) => {
    assertOutputFiles(result);

    result.outputFiles.forEach((file) => {
      const bytes = file.text.length;
      const mbInDecimal = (bytes / 1_000_000).toFixed(4);

      const filePathArr = file.path.split('/');
      console.log(
        `✅ ${filePathArr.slice(filePathArr.length - 2, filePathArr.length - 1)} - ${mbInDecimal} MB`,
      );
    });
  });
}
