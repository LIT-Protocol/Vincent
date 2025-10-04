// Incrementally enforcing some stricter rules
const strictConfig = require('../../../eslint.config.strict.js');

module.exports = [
  ...strictConfig,
  {
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredDependencies: [
            // ethers-v6 is an alias for ethers@^6, used in get-gas-params.ts
            'ethers-v6',
          ],
        },
      ],
    },
  },
];
