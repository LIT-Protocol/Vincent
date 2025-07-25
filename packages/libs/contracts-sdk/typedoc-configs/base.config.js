module.exports = {
  extends: '../../../../typedoc.config.base.js',
  $schema: 'https://typedoc.org/schema.json',
  entryPoints: ['../src/index.ts'],
  name: 'vincent-contracts-sdk',
  tsconfig: '../tsconfig.lib.json',
  includeVersion: true,
  navigation: {
    includeCategories: true,
  },
  categorizeByGroup: false,
  // categoryOrder: ['API', 'Interfaces'], // All we export is functions in this package
  visibilityFilters: {},
  sort: 'source-order',
};
