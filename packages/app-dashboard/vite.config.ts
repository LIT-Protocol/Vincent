import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: 'globalThis',
    'process.env': process.env,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['@lit-protocol/vincent-sdk'],
  },
  build: {
    commonjsOptions: {
      include: ['@lit-protocol/vincent-sdk'],
    },
  },
});
