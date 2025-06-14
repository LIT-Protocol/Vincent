module.exports = {
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  passWithNoTests: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts'],
};
