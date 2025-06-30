import { getRollupConfig } from '@lit-protocol/lit-action-bundler-rollup';

import { bundledPolicy } from './plugins/bundledPolicy';
import type { VincentBundlerConfig } from './types';
import { getPolicyHandlerTemplate } from './getPolicyHandlerTemplate';

import type { RollupOptions } from 'rollup';

export function getPolicyRollupConfig(params: VincentBundlerConfig): RollupOptions {
  const { sourceFilePath, sourceSchemasFilePath, outputDir } = params;

  const config = getRollupConfig({
    ...params,
    getLitActionHandlerContent: getPolicyHandlerTemplate({
      outputDir,
      sourcePolicyFilePath: sourceFilePath,
      sourceSchemasFilePath,
    }),
  });

  if (!config.plugins) {
    throw new Error('Missing plugins in rollup config');
  }

  if (!(config.plugins instanceof Array)) {
    throw new Error('Plugins must be an array');
  }

  // Add our plugin that emits the .ts file that uses `asBundledVincentPolicy()` for consumption by tools
  config.plugins.push(
    bundledPolicy({
      outputDir,
      sourcePolicyFilePath: params.sourceFilePath,
      pkgName: 'test', // FIXME:
    }),
  );

  return config;
}
