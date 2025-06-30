// src/lib/plugins/generateLitActionHandler.ts

import type { Plugin } from 'rollup';

import fs from 'fs';
import path from 'path';

import { HANDLER_CHUNK_ID } from '../constants';
import { getLitBundleContext } from '../litBundleContext';
import { ensureDir } from '../utils';

export function generateLitActionHandler({
  getLitActionHandlerContent,
  outputFilePath,
}: {
  getLitActionHandlerContent: () => string;
  outputFilePath: string;
}): Plugin {
  return {
    buildStart() {
      const ctx = getLitBundleContext(this);

      const content = getLitActionHandlerContent();

      ensureDir(outputFilePath);
      fs.writeFileSync(outputFilePath, content);

      // emitFile() registers the output from this writeFileSync() so that rollup can find it later and generate the minified / IIFE wrapped version

      // Adding its details to `ctx.chunkIds` allows other plugins in the pipeline to access the transpiled code
      // To compute IPFS CIDs of the raw code and export it for use w/ the LitNodeClient.
      // See `wrapIIFE`'s use of getCompiledHandlerCode()
      ctx.chunkIds[HANDLER_CHUNK_ID] = this.emitFile({
        id: path.resolve(outputFilePath),
        name: HANDLER_CHUNK_ID,
        type: 'chunk',
      });
    },
    name: 'generate-lit-action-handler-ts',
  };
}
