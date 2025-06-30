// src/lib/plugins/generateLitActionHandler.ts

import type { Plugin } from 'rollup';

import fs from 'fs';

import { HANDLER_CHUNK_ID } from '../constants';
import { ensureDir } from '../utils';
import { type LitBundleContext } from './createLitBundleContext';

export function generateLitActionHandler({
  ctx,
  getLitActionHandlerContent,
  outputFilePath,
}: {
  ctx: LitBundleContext;
  getLitActionHandlerContent: () => string;
  outputFilePath: string;
}): Plugin {
  return {
    buildStart() {
      const content = getLitActionHandlerContent();

      ensureDir(outputFilePath);
      fs.writeFileSync(outputFilePath, content);

      console.log('emitfile', outputFilePath);
      // emitFile() registers the output from this writeFileSync() so that rollup can find it later and generate the minified / IIFE wrapped version

      // Adding its details to `ctx.chunkIds` allows other plugins in the pipeline to access the transpiled code
      // To compute IPFS CIDs of the raw code and export it for use w/ the LitNodeClient.
      // See `wrapIIFE`'s use of getCompiledHandlerCode()
      ctx.chunkIds[HANDLER_CHUNK_ID] = this.emitFile({
        id: outputFilePath,
        name: HANDLER_CHUNK_ID,
        type: 'chunk',
      });
    },
    name: 'generate-lit-action-handler-ts',
  };
}
