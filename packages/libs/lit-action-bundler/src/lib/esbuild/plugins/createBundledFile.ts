import type { Plugin } from 'esbuild';

import fs from 'fs';
import path from 'path';

/** @ts-expect-error No types for this pkg */
import Hash from 'ipfs-only-hash';

import type { GetLitActionHandlerFunc } from '../types';

import { getMetadataJsonFileContent } from '../templates';
import { assertOutputFiles, ensureDirectoryExistence } from '../utils';

export async function createBundledFile({
  sourceDir,
  getLitActionHandler,
}: {
  sourceDir: string;
  getLitActionHandler: GetLitActionHandlerFunc;
}): Promise<Plugin> {
  return {
    name: `create-bundled-lit-action-file`,
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

        const outputPath = path.dirname(path.resolve(outputFile.path));

        // Calculate the relative path from the output directory to the source directory so we can codegen the wrapper
        // using the passed `getLitActionHandler()` method
        const relativePathToSourceDir = path.relative(outputPath, sourceDir);

        // Construct the path to the lit-action.ts file relative to the output directory
        const sourcePath = path.join(relativePathToSourceDir, `lit-action`);

        // Generate the bundled source code with the computed relative path
        const bundledSource = getLitActionHandler({ outputPath, ipfsCid, sourcePath });

        // Use the output path to determine the bundled path
        const bundledPath = path.join(outputPath, `bundled-lit-action.ts`);

        ensureDirectoryExistence(bundledPath);
        fs.writeFileSync(bundledPath, bundledSource);

        // Write metadata JSON
        // Use the directory of the generated output file
        const metadataPath = path.join(outputPath, `lit-action-metadata.json`);
        const metadataContent = getMetadataJsonFileContent({ ipfsCid });
        ensureDirectoryExistence(metadataPath);
        fs.writeFileSync(metadataPath, metadataContent);
      });
    },
  };
}
