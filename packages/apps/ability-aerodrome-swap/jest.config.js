const path = require('path');

module.exports = {
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: [
    // PNPM style: scoped packages with `.` become `+`, and non-scoped stay the same
    // Include all @account-kit, @aa-sdk, @wagmi packages and @dromos-labs/sdk.js using wildcards
    '<rootDir>/node_modules/.pnpm/(?!(@noble\\+secp256k1|cbor2|@cto\\.af\\+wtf8|@t3-oss\\+env-core|@account-kit\\+[^@]+|@aa-sdk\\+[^@]+|@lit-protocol\\+vincent-scaffold-sdk|@wagmi\\+[^@]+|@tanstack\\+[^@]+|@dromos-labs\\+sdk\\.js)@)',

    // Absolute path variant (in case of different module resolution by Jest)
    `${path.join(__dirname, '../..')}/node_modules/.pnpm/(?!(@noble\\+secp256k1|cbor2|@cto\\.af\\+wtf8|@t3-oss\\+env-core|@account-kit\\+[^@]+|@aa-sdk\\+[^@]+|@lit-protocol\\+vincent-scaffold-sdk|@wagmi\\+[^@]+|@tanstack\\+[^@]+|@dromos-labs\\+sdk\\.js)@)`,

    // Fallback for non-PNPM node_modules structure
    'node_modules/(?!.pnpm|@noble/secp256k1|cbor2|@cto\\.af/wtf8|@t3-oss/env-core|@account-kit/[^/]+|@aa-sdk/[^/]+|@lit-protocol/vincent-scaffold-sdk|@wagmi/[^/]+|@tanstack/[^/]+|@dromos-labs/sdk.js)',
  ],
};
