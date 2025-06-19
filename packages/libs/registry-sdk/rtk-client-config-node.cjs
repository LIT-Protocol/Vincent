/**
 * @type {import('@rtk-query/codegen-openapi').ConfigFile}
 */
const config = {
  schemaFile: './src/generated/openapi.json',
  apiFile: './src/lib/baseVincentRtkApiNode.ts',
  apiImport: 'baseVincentRtkApiNode',
  outputFile: './src/generated/vincentApiClientNode.ts',
  exportName: 'vincentApiClientNode',
};

module.exports = config;
