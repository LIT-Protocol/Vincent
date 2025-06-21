/**
 * @type {import('@rtk-query/codegen-openapi').ConfigFile}
 */
const config = {
  schemaFile: './src/generated/openapi.json',
  apiFile: './src/lib/baseVincentRtkApi.ts',
  apiImport: 'baseVincentRtkApi',
  outputFile: './src/generated/vincentApiClient.ts',
  exportName: 'vincentApiClient',
  hooks: {
    queries: true,
    lazyQueries: true,
    mutations: true,
  },
};

module.exports = config;
