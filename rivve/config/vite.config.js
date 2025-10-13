import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './html-output',
  server: {
    port: 3000,
    open: true,
    host: true
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './html-output')
    }
  },
  publicDir: false
});
