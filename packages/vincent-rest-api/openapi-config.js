/**
 * @type {import('@rtk-query/codegen-openapi').ConfigFile}
 */
const config = {
  schemaFile: './src/generated/openapi.json',
  apiFile: './src/generated/api/emptyApi.ts',
  apiImport: 'emptySplitApi',
  outputFile: './src/generated/api/vincentApi.ts',
  exportName: 'vincentApi',
  hooks: true,
};

module.exports = config;
