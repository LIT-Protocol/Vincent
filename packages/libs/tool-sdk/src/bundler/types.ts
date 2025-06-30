import type { LitActionBundlerConfig } from '@lit-protocol/lit-action-bundler-rollup';

export type VincentBundlerConfig = Omit<LitActionBundlerConfig, 'getLitActionHandlerContent'> & {
  packageName: string;
  sourceSchemasFilePath: string;
};
