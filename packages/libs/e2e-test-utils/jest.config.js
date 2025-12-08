module.exports = {
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.spec.ts'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts'],
  setupFiles: ['<rootDir>/jest.setup.js'],
};
