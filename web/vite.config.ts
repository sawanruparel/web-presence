import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { htmlPagesPlugin } from './scripts/vite-plugin-html-pages'
import { devServerPlugin } from './scripts/dev-server-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    htmlPagesPlugin({
      contentDir: '../../content',
      outputDir: './dist',
      rivveOutputDir: '../../rivve/html-output'
    }),
    devServerPlugin('../../content', '../../rivve/html-output')
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    // Serve static HTML files for content pages in development
    middlewareMode: false,
    fs: {
      allow: ['..']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false
      }
    }
  },
  define: {
    // Make environment variables available to the client
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || 'http://localhost:8787'),
    'import.meta.env.VITE_DEV_MODE': JSON.stringify(process.env.VITE_DEV_MODE || 'true')
  }
})
