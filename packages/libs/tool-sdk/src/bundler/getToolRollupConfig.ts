import { getRollupConfig } from '@lit-protocol/lit-action-bundler-rollup';

import { bundledTool } from './plugins/bundledTool';
import type { VincentBundlerConfig } from './types';
import { getToolHandlerTemplate } from './getToolHandlerTemplate';

export function getToolRollupConfig(params: VincentBundlerConfig) {
  const { sourceFilePath, outputDir, sourceSchemasFilePath } = params;

  const config = getRollupConfig({
    ...params,
    getLitActionHandlerContent: getToolHandlerTemplate({
      outputFilePath: outputDir,
      sourceToolFilePath: sourceFilePath,
      sourceSchemasFilePath,
    }),
  });

  if (!config.plugins) {
    throw new Error('Missing plugins in rollup config');
  }

  if (!(config.plugins instanceof Array)) {
    throw new Error('Plugins must be an array');
  }

  // Add our plugin that emits the .ts file that uses `asBundledVincentTool()` for consumption by tools
  config.plugins.push(
    bundledTool({
      outputFilePath: params.outputDir,
      sourceToolFilePath: params.sourceFilePath,
    }),
  );
}
