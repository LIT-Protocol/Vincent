import type { Plugin } from 'esbuild';

import fs from 'fs';
import path from 'path';

/** @ts-expect-error No types for this pkg */
import Hash from 'ipfs-only-hash';

import { getLitActionBundledCodeModuleContent } from '../templates';
import { assertOutputFiles, ensureDirectoryExistence } from '../utils';

export async function wrapIIFEInStringPlugin(): Promise<Plugin> {
  return {
    name: 'wrap-iife-in-string',
    setup(build) {
      build.initialOptions.write = false;

      build.onEnd(async (result) => {
        if (result.errors.length > 0) {
          console.error('Build failed with errors:', result.errors);
          return;
        }

        assertOutputFiles(result);

        const outputFile = result.outputFiles[0];
        const content = outputFile.text;
        const ipfsCid = await Hash.of(content);

        const wrapped = getLitActionBundledCodeModuleContent({ content, ipfsCid });

        // Use the path from the generated output file
        const outputPath = path.resolve(outputFile.path);

        ensureDirectoryExistence(outputPath);
        fs.writeFileSync(outputPath, wrapped);
      });
    },
  };
}
