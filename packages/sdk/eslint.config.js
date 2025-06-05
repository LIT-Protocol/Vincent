const baseConfig = require('../../eslint.config.js');

module.exports = [
  ...baseConfig,
  {
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          // TODO: Compose this from the root of the repo rather than repeating it.
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs}',
            '{projectRoot}/jest.config.{js,cjs,mjs,ts}',
            '{projectRoot}/scripts/*.{js,cjs,mjs,ts}',
            '{projectRoot}/vite.config.*',
          ],
          ignoredDependencies: ['express', '@types/express'],
        },
      ],
    },
  },
];
