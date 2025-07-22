const strictConfig = require('../../../eslint.config.strict.js');

module.exports = [
  ...strictConfig,
  {
    files: ['**/src/index.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',

        // Disallow re-exports like `export * from`
        {
          selector: 'ExportNamedDeclaration[source!=null]',
          message:
            'Re-exports are not allowed in src/index.ts — this file is reserved for Nx build target only.',
        },

        // Disallow named exports like `export const X = ...`
        {
          selector: 'ExportNamedDeclaration > VariableDeclaration',
          message: 'Named exports are not allowed in src/index.ts — use export {} only.',
        },

        // Disallow imports
        {
          selector: 'ImportDeclaration',
          message:
            'Imports are not allowed in src/index.ts — use this only to define an empty module for Nx.',
        },

        // Disallow expressions/statements like `console.log()` etc.
        {
          selector: 'ExpressionStatement',
          message: 'Side-effect statements are not allowed in src/index.ts — use export {} only.',
        },
      ],
    },
  },
  {
    files: ['package.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          buildTargets: ['build'],
          checkVersionMismatches: true,
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs}',
            '{projectRoot}/jest.config.{js,cjs,mjs,ts}',
            '{projectRoot}/vite.config.*',
            '{projectRoot}/esbuild.config.{js,cjs,mjs}',
          ],
          ignoredDependencies: [
            'express', // Types only
            '@lit-protocol/types', // Types only
            '@lit-protocol/pkp-ethers', // Types only
            'live-server', // dev server for typedoc
            'tslib', // emitDeclarationOnly: true for esbuild interferes with this
          ],
        },
      ],
    },
  },
];
