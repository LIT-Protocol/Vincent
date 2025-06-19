module.exports = {
  extends: '../../../../typedoc.config.base.js',
  $schema: 'https://typedoc.org/schema.json',
  entryPoints: ['../src/index.ts'],
  name: 'vincent-mcp-sdk',
  tsconfig: '../tsconfig.lib.json',
  includeVersion: true,
  navigation: {
    includeCategories: true,
  },
  defaultCategory: 'API',
  categorizeByGroup: false,
  categoryOrder: ['vincent-mcp-sdk', 'Vincent MCP SDK'],
  visibilityFilters: {},
};
