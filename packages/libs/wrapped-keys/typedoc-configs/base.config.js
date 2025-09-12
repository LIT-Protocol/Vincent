module.exports = {
  extends: '../../../../typedoc.config.base.js',
  $schema: 'https://typedoc.org/schema.json',
  entryPoints: ['../src/index.ts'],
  name: 'vincent-ability-sdk',
  tsconfig: '../tsconfig.lib.json',
  includeVersion: true,
  navigation: {
    includeCategories: true,
  },
  categorizeByGroup: false,
  categoryOrder: ['API Methods', 'Interfaces'],
  visibilityFilters: {},
  sort: 'source-order',
};
