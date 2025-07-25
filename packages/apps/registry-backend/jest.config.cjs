const path = require('path');
module.exports = {
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  testMatch: ['**/index.spec.ts', '**/packageImporter.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  globalSetup: './test/integration/global-setup.ts',
  globalTeardown: './test/integration/global-teardown.ts',
  setupFilesAfterEnv: ['./jest.setup.js'],
  transformIgnorePatterns: [
    // PNPM style: scoped packages with `.` become `+`, and non-scoped stay the same
    '<rootDir>/node_modules/.pnpm/(?!(@noble\\+secp256k1|cbor2|@cto\\.af\\+wtf8)@)',

    // Absolute path variant (in case of different module resolution by Jest)
    `${path.join(__dirname, '../..')}/node_modules/.pnpm/(?!(@noble\\+secp256k1|cbor2|@cto\\.af\\+wtf8)@)`,

    // Fallback for non-PNPM node_modules structure
    'node_modules/(?!.pnpm|@noble/secp256k1|cbor2|@cto\\.af/wtf8)',
  ],
};
