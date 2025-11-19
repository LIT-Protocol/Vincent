// Incrementally enforcing some stricter rules
const strictConfig = require('../../../eslint.config.strict.js');

module.exports = [
  ...strictConfig,
  {
    ignores: ['**/lib/**/*'],
  },
  {
    files: ['package.json'],
    rules: {
      // Fix for this incorrect eslint error:
      // packages/libs/contracts-sdk/package.json
      //  32:3  error  The "contracts-sdk" project uses the following packages, but they are missing from "dependencies":
      //   - @lit-protocol/types  @nx/dependency-checks
      '@nx/dependency-checks': ['error', { ignoredDependencies: ['@lit-protocol/types'] }],
    },
  },
];
