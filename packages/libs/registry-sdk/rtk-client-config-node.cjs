/**
 * @type {import('@rtk-query/codegen-openapi').ConfigFile}
 */
const config = {
  schemaFile: './src/generated/openapi.json',
  apiFile: './src/lib/internal/baseVincentRtkApiNode.ts',
  apiImport: 'baseVincentRtkApiNode',
  outputFile: './src/generated/vincentApiClientNode.ts',
  exportName: 'vincentApiClientNode',
  encodePathParams: true,
  tag: true,
};

module.exports = config;
