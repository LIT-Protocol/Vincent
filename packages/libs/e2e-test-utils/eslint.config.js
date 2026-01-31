// Incrementally enforcing some stricter rules
const strictConfig = require('../../../eslint.config.strict.js');

module.exports = [
  ...strictConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
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
          ignoredDependencies: ['@lit-protocol/contracts-sdk'],
        },
      ],
    },
  },
];
