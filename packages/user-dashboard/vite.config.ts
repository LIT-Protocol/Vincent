import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite';
import path from 'path'
import Pages from 'vite-plugin-pages'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), Pages()],
  define: {
    global: 'globalThis',
    'process.env': process.env,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
