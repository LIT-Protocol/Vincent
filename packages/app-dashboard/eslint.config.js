import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

import baseConfig from '../../eslint.config.js';

export default [
  ...baseConfig,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': ['off'],
    },
  },
  {
    files: ['*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          // TODO: Compose this from the root of the repo rather than repeating it.
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs}',
            '{projectRoot}/jest.config.{js,cjs,mjs,ts}',
            '{projectRoot}/scripts/*.{js,cjs,mjs,ts}',
            '{projectRoot}/vite.config.*',
          ],
          ignoredDependencies: ['vite', 'tw-animate-css', '@tailwindcss/vite'],
        },
      ],
    },
  },
];
