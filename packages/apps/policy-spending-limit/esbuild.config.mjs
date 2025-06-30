import { getPolicyRollupConfig } from '@lit-protocol/vincent-tool-sdk';
import { rollup } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import path from 'node:path';

console.log('Building policy-spending-limit...');
// Create a Rollup configuration for bundling a LIT Action

// Use the configuration with Rollup
async function build() {
  console.log('Building policy-spending-limit...', 'BUILD');

  /** @type getPolicyRollupConfig */
  const rollupConfig = getPolicyRollupConfig({
    outputDir: './src/generated',
    sourceFilePath: './src/lib/vincent-policy.ts',
    sourceSchemasFilePath: './src/lib/schemas.ts',
    tsconfigPath: path.resolve('./tsconfig.lib.json'),
  });
  console.log('rollupConfig', rollupConfig);

  const bundle = await rollup(rollupConfig);
  await bundle.write({ dir: './src/generated' });
}

build().catch(console.error);
