const baseConfig = require('../../../eslint.config.js');

module.exports = [
  ...baseConfig,
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
            // It's a peerDependency to ensure people don't try to use the wrong VincentAbilityClient with it -- not directly used.
            '@lit-protocol/vincent-app-sdk',
          ],
        },
      ],
    },
  },
];
