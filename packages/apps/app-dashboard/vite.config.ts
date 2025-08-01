import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    sentryVitePlugin({
      org: 'lit-protocol-lw',
      project: 'vincent-dashboard',
    }),
  ],

  define: {
    global: 'globalThis',
    'process.env': process.env,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    conditions: ['require', 'node', 'import', 'module', 'browser', 'default'],
  },

  ssr: {
    noExternal: [
      '@lit-protocol/vincent-registry-sdk',
      '@lit-protocol/vincent-app-sdk',
      '@lit-protocol/vincent-contracts-sdk',
    ],
  },

  optimizeDeps: {
    include: [
      '@lit-protocol/vincent-app-sdk/jwt',
      '@lit-protocol/vincent-registry-sdk',
      '@lit-protocol/vincent-contracts-sdk',
    ],
    force: true,
  },

  build: {
    sourcemap: true,
    commonjsOptions: {
      include: [
        /node_modules/,
        /packages\/libs\/registry-sdk/,
        /packages\/libs\/contracts-sdk/,
        /packages\/libs\/app-sdk/,
      ],
    },
  },
});
