import type { BuildResult } from 'esbuild';

import path from 'path';

import esbuild from 'esbuild';

import type { BuildLitActionOptions } from './types';

import { aliasFetch } from './plugins/aliasFetch';
import { createBundledFile } from './plugins/createBundledFile';
import { wrapIIFEInStringPlugin } from './plugins/wrapIIFEInString';
import { assertOutputFiles } from './utils';

/** Builds a Lit Action
 */
export async function buildLitAction({
  entryPoint,
  outdir,
  tsconfigPath,
  getLitActionHandler,
}: BuildLitActionOptions) {
  const sourceDir = path.dirname(entryPoint);

  await esbuild
    .build({
      outdir,
      tsconfig: tsconfigPath,
      entryPoints: [entryPoint],
      bundle: true,
      minify: false,
      sourcemap: false,
      treeShaking: true,
      metafile: true,
      plugins: [
        aliasFetch(),
        await wrapIIFEInStringPlugin(),
        await createBundledFile({ sourceDir: sourceDir, getLitActionHandler: getLitActionHandler }),
      ],
      platform: 'browser',
      write: false,
    })
    .then((result: BuildResult) => {
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
