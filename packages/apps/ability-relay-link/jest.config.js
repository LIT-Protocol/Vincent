const path = require('path');

const swc = {
  sourceMaps: 'inline',
  module: { type: 'commonjs' },
  jsc: {
    target: 'es2022',
    parser: { syntax: 'typescript', tsx: true },
  },
};

module.exports = {
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'json', 'node'],

  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  watchPathIgnorePatterns: ['<rootDir>/dist/'],
  transform: {
    '^.+\\.[tj]sx?$': ['@swc/jest', swc],
    '^.+\\.mjs$': ['@swc/jest', swc],
  },
  transformIgnorePatterns: [
    // PNPM style: scoped packages with `.` become `+`, and non-scoped stay the same
    '<rootDir>/node_modules/.pnpm/(?!(@noble\\+secp256k1|cbor2|@cto\\.af\\+wtf8|@t3-oss\\+env-core|@account-kit\\+[^@]+|@aa-sdk\\+[^@]+|@lit-protocol\\+vincent-scaffold-sdk|@wagmi\\+[^@]+|@tanstack\\+[^@]+)@)',

    // Absolute path variant (in case of different module resolution by Jest)
    `${path.join(__dirname, '../..')}/node_modules/.pnpm/(?!(@noble\\+secp256k1|cbor2|@cto\\.af\\+wtf8|@t3-oss\\+env-core|@account-kit\\+[^@]+|@aa-sdk\\+[^@]+|@lit-protocol\\+vincent-scaffold-sdk|@wagmi\\+[^@]+|@tanstack\\+[^@]+)@)`,

    // Fallback for non-PNPM node_modules structure
    'node_modules/(?!.pnpm|@noble/secp256k1|cbor2|@cto\\.af/wtf8|@t3-oss/env-core|@account-kit/[^/]+|@aa-sdk/[^/]+|@lit-protocol/vincent-scaffold-sdk|@wagmi/[^/]+|@tanstack/[^/]+)',
  ],
};
