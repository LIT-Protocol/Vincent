module.exports = {
  displayName: '@lit-protocol/vincent-tool-uniswap-swap:e2e',
  preset: '../../../../jest.preset.js',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  tsconfig: '../tsconfig.spec.json',
};
