module.exports = {
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  passWithNoTests: true,
  globalSetup: './src/tests/integration/global-setup.ts',
  globalTeardown: './src/tests/integration/global-teardown.ts',
};
