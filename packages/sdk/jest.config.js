module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  passWithNoTests: true,
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts'],
};
