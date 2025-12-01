const path = require('path');

module.exports = {
  displayName: 'ability-relay-link-smart-account',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: [
    '<rootDir>/node_modules/.pnpm/(?!(@noble\\+secp256k1|cbor2|@cto\\.af\\+wtf8|@account-kit\\+[^@]+|@aa-sdk\\+[^@]+|@lit-protocol\\+vincent-scaffold-sdk|@t3-oss\\+[^@]+)@)',
    `${path.join(__dirname, '../..')}/node_modules/.pnpm/(?!(@noble\\+secp256k1|cbor2|@cto\\.af\\+wtf8|@account-kit\\+[^@]+|@aa-sdk\\+[^@]+|@lit-protocol\\+vincent-scaffold-sdk|@t3-oss\\+[^@]+)@)`,
    'node_modules/(?!.pnpm|@noble/secp256k1|cbor2|@cto\\.af/wtf8|@account-kit/[^/]+|@aa-sdk/[^/]+|@lit-protocol/vincent-scaffold-sdk|@t3-oss/[^/]+)',
  ],
  detectOpenHandles: true,
  passWithNoTests: true,
};
