const strictConfig = require('../../../eslint.config.strict.js');

module.exports = [
  ...strictConfig,
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
            // debug is only directly referenced in the root of the repo, which confuses NX because it's technically not part of the build target.
            'debug',
            // cors is used in src/lib/express/index.ts but NX doesn't detect it in the build target
            'cors',
            // Used in packageImporter.ts and getAgentAccount.ts - nx doesn't trace these imports properly
            '@zerodev/sdk',
            'fs-extra',
            'tar',
          ],
        },
      ],
    },
  },
];
