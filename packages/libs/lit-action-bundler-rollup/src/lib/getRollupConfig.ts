// src/lib/rollupBundler.ts

import type { RollupOptions } from 'rollup';

import alias from '@rollup/plugin-alias';
import inject from '@rollup/plugin-inject';
import typescript from '@rollup/plugin-typescript';
import path from 'path';

import type { LitActionBundlerConfig } from './types';

import { createLitBundleContext } from './plugins/createLitBundleContext';
import { emitMetadataFile } from './plugins/emitMetadataFile';
import { generateLitActionHandler } from './plugins/generateLitActionHandler';
import { rewriteNodeBuiltinsToNodePrefix } from './plugins/rewriteNodeBuiltinsToNodePrefix';
import { writeBundledIIFECode } from './plugins/writeBundledIIFECode';

export function getRollupConfig({
  getLitActionHandlerContent,
  outputDir,
  sourceFilePath,
  tsconfigPath,
}: LitActionBundlerConfig): RollupOptions {
  const sourceFileName = path.basename(sourceFilePath, '.ts');
  const generatedHandlerPath = path.resolve(outputDir, `${sourceFileName}-handler.ts`);

  return {
    input: sourceFilePath,
    output: {
      dir: outputDir,
      entryFileNames: '[name].js',
      format: 'iife',
    },
    plugins: [
      // Shared state is used to track the generated LA handler file
      createLitBundleContext(),

      // 1. Rewrite bare imports like "crypto" to "node:crypto"
      rewriteNodeBuiltinsToNodePrefix(),

      // 2. Generate the LA handler wrapper file
      generateLitActionHandler({
        getLitActionHandlerContent,
        outputFilePath: generatedHandlerPath,
      }),

      // 4. Replace node-fetch/cross-fetch with the Deno shim
      alias({
        entries: [
          { find: 'node-fetch', replacement: path.resolve('./shims/fetch.js') },
          { find: /^cross-fetch(\/.*)?$/, replacement: path.resolve('./shims/fetch.js') },
        ],
      }),

      // 5. Compile TypeScript
      typescript({
        tsconfig: tsconfigPath,
      }),

      // 6. Inject missing global bindings (Buffer, crypto) as imports
      inject({
        Buffer: ['node:buffer', 'Buffer'],
        crypto: ['node:crypto', 'webcrypto'],
      }),

      // This creates the raw, bundled code that is executed by the LIT nodes (e.g. published to IPFS)
      // File export shape is { code: string, ipfsCid: string }
      writeBundledIIFECode(outputDir),

      // Emit a metadata JSON file w/ the ipfsCid for tooling that can't import the JS module
      emitMetadataFile({
        outputDir,
        sourceFileName,
      }),

      // TODO: Allow `postBundlePlugins` in configuration?
      // Finally, emit the file that exports the tool-consumable `asBundledVincentPolicy()` result
      // bundledPolicy({ outputDir, pkgName: 'vincent-policy', sourceFileName }),
    ],
  };
}
