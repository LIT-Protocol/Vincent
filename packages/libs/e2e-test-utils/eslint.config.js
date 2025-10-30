// Incrementally enforcing some stricter rules
const strictConfig = require('../../../eslint.config.strict.js');

module.exports = [
  ...strictConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
];
