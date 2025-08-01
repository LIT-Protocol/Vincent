module.exports = {
  extends: '../../../../typedoc.config.base.js',
  $schema: 'https://typedoc.org/schema.json',
  entryPoints: [
    '../src/abilityClient/index.ts',
    '../src/jwt/index.ts',
    '../src/webAuthClient/index.ts',
    '../src/expressMiddleware/index.ts',
    '../src/utils/typedocRoot.ts',
  ],
  name: 'vincent-app-sdk',
  tsconfig: '../tsconfig.lib.json',
  includeVersion: true,
  navigation: {
    includeCategories: true,
    compactFolders: false,
  },
  excludeExternals: true,
  categorizeByGroup: false,
  categoryOrder: ['API', 'Interfaces'],
  visibilityFilters: {},
};
