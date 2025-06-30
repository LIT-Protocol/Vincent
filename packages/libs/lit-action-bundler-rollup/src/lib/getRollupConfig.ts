// src/lib/rollupBundler.ts

import type { RollupOptions } from 'rollup';

import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import inject from '@rollup/plugin-inject';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import path from 'path';
import esbuild from 'rollup-plugin-esbuild';

import type { LitBundleContext } from './plugins/createLitBundleContext';
import type { LitActionBundlerConfig } from './types';

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
  const generatedHandlerPath = path.join(outputDir, `${sourceFileName}-handler.ts`);

  const litBundleContext: LitBundleContext = {
    chunkFileNames: {},
    chunkIds: {},
  };

  console.log('getRollupConfig', { outputDir });
  return {
    external: [
      'node-fetch',
      'cross-fetch',
      'node:buffer',
      'node:crypto',
      'webcrypto',
      'node:util',
      'node:url',
      'node:os',
      'node:tty',
    ],
    input: sourceFilePath,
    output: {
      file: 'vincent-policy-handler.bundled.min.js',
      format: 'iife',
      inlineDynamicImports: true,
      sourcemap: false,
    },
    plugins: [
      // {
      //   buildStart() {
      //     console.log('✅ Build started!');
      //   },
      //   generateBundle() {
      //     console.log('✨ generateBundle reached!');
      //   },
      //   load(id) {
      //     console.log(`📦 Loading: ${id}`);
      //     return null;
      //   },
      //   name: 'fail-fast-trace',
      //   resolveId(source) {
      //     console.log(`🔍 Resolving: ${source}`);
      //     return null;
      //   },
      // },

      alias({
        entries: [
          { find: 'node-fetch', replacement: path.resolve('./shims/fetch.js') },
          // { find: /^cross-fetch(\/.*)?$/, replacement: path.resolve('./shims/fetch.js') },
        ],
      }),

      commonjs(),

      esbuild({
        include: ['src/**/*.ts', 'src/**/*.json'],
        minify: true,
        sourceMap: true,
        target: 'esnext',
        tsconfig: tsconfigPath,
      }),

      resolve({ extensions: ['.js', '.ts'] }),

      json(),

      inject({
        Buffer: ['node:buffer', 'Buffer'],
        crypto: ['node:crypto', 'webcrypto'],
      }),

      rewriteNodeBuiltinsToNodePrefix(),

      generateLitActionHandler({
        ctx: litBundleContext,
        getLitActionHandlerContent,
        outputFilePath: generatedHandlerPath,
      }),

      // This creates the raw, bundled code that is executed by the LIT nodes (e.g. published to IPFS)
      // File export shape is { code: string, ipfsCid: string }
      writeBundledIIFECode(outputDir, litBundleContext),

      // Emit a metadata JSON file w/ the ipfsCid for tooling that can't import the JS module
      emitMetadataFile({
        ctx: litBundleContext,
        outputDir,
        sourceFileName,
      }),

      {
        buildStart() {
          console.log('[DEBUG] build started');
        },
        generateBundle(_, bundle) {
          console.log('[DEBUG] generateBundle triggered with files:', Object.keys(bundle));
        },
        name: 'debug-plugin',
      },
    ],
  };
}
