// Incrementally enforcing some stricter rules
const strictConfig = require('../../../eslint.config.strict.js');

module.exports = [
  ...strictConfig,
  {
    files: [
      'src/lib/lit-actions/self-executing-actions/common/batchGenerateEncryptedKeys.ts',
      'src/lib/lit-actions/self-executing-actions/solana/generateEncryptedSolanaPrivateKey.ts',
    ],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
];
