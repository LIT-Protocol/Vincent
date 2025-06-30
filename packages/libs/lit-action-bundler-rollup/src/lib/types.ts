// src/lib/types.ts

export interface LitActionBundlerConfig {
  getLitActionHandlerContent: () => string;
  outputDir: string;
  sourceFilePath: string;
  tsconfigPath: string;
}
