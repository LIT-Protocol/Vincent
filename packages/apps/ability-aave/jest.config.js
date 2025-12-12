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
  transformIgnorePatterns: ['node_modules/(?!.*(cbor2|@cto\\.af|\\.mjs$))'],
};
