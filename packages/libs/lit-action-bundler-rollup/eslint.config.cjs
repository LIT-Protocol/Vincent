const { createTypeScriptImportResolver } = require('eslint-import-resolver-typescript');
const pluginImportX = require('eslint-plugin-import-x');
const perfectionist = require('eslint-plugin-perfectionist');

const baseConfig = require('../../../eslint.config.js');

module.exports = [
  ...baseConfig,
  perfectionist.configs['recommended-natural'],
  { files: ['**/*.ts', '**/*.tsx'], ...pluginImportX.flatConfigs.recommended },
  { files: ['**/*.ts', '**/*.tsx'], ...pluginImportX.flatConfigs.typescript },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'error',
      'class-methods-use-this': ['off'],
      'import-x/no-default-export': ['error'],
      'import-x/no-duplicates': ['error'],
      'import-x/no-extraneous-dependencies': ['off'],
      'import-x/no-relative-packages': ['error'],
      'import-x/no-unresolved': ['error'],
      'import-x/prefer-default-export': ['off'],
      'no-await-in-loop': 'warn',
      // 'no-console': 'error',
      'no-param-reassign': 'error',
      // '@typescript-eslint/naming-convention': ['off'],
      'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
      'no-restricted-syntax': [
        'error',
        {
          message:
            'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
          selector: 'ForInStatement',
        },
        {
          message:
            'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
          selector: 'LabeledStatement',
        },
        {
          message:
            '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
          selector: 'WithStatement',
        },
      ],
      'no-underscore-dangle': ['off'],
      'no-useless-escape': 'off',
    },
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver()],
      'import/internal-regex': '^@lit-protocol/',
    },
  },
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}',
            '{projectRoot}/rollup.config.{js,ts,mjs,mts,cjs,cts}',
          ],
        },
      ],
    },
  },
];
