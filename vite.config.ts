import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { htmlPagesPlugin } from './scripts/vite-plugin-html-pages'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    htmlPagesPlugin({
      contentDir: './content',
      outputDir: './dist',
      rivveOutputDir: './rivve/html-output'
    })
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
})
