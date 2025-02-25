/** @type {import('jest').Config} */
export default {
  displayName: 'vincent-service-dca',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.m?[tj]s$': [
      'babel-jest',
      {
        presets: [
          [
            '@babel/preset-env',
            {
              targets: {
                node: 'current',
              },
            },
          ],
          '@babel/preset-typescript',
        ],
        plugins: ['@babel/plugin-transform-modules-commonjs'],
      },
    ],
  },
  moduleFileExtensions: ['ts', 'mts', 'js', 'mjs', 'html'],
  coverageDirectory: '../../coverage/packages/vincent-service-dca',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testMatch: ['**/test/**/*.test.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill|mongodb-memory-server)/)',
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
