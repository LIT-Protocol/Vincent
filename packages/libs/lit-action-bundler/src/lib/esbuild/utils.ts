import type { BuildResult, OutputFile } from 'esbuild';

import fs from 'fs';
import path from 'path';

export const ensureDirectoryExistence = (filePath: string) => {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
};

export function assertOutputFiles(
  result: BuildResult,
): asserts result is BuildResult & { outputFiles: OutputFile[] } {
  if (!result.outputFiles) {
    throw new Error('No output files found');
  }
}
