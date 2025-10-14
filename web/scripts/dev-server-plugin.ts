import { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'
import { generateContentMetadata, generateRivveHTMLFiles } from './vite-plugin-html-pages'

export function devServerPlugin(contentDir: string, rivveOutputDir: string): Plugin {
  return {
    name: 'dev-server-plugin',
    configureServer(server) {
      // Generate content metadata and rivve HTML files on server start
      const metadata = generateContentMetadata(contentDir, rivveOutputDir)
      generateRivveHTMLFiles(contentDir, rivveOutputDir)
      
      // Serve static HTML files for content pages from dist directory
      const distDir = path.join(process.cwd(), 'dist')
      
      server.middlewares.use('/notes', (req, res, next) => {
        if (req.url && req.url.endsWith('.html')) {
          const slug = req.url.replace('.html', '').replace('/', '')
          const htmlFile = path.join(distDir, 'notes', `${slug}.html`)
          
          if (fs.existsSync(htmlFile)) {
            const html = fs.readFileSync(htmlFile, 'utf-8')
            res.setHeader('Content-Type', 'text/html')
            res.end(html)
            return
          }
        }
        next()
      })
      
      server.middlewares.use('/publications', (req, res, next) => {
        if (req.url && req.url.endsWith('.html')) {
          const slug = req.url.replace('.html', '').replace('/', '')
          const htmlFile = path.join(distDir, 'publications', `${slug}.html`)
          
          if (fs.existsSync(htmlFile)) {
            const html = fs.readFileSync(htmlFile, 'utf-8')
            res.setHeader('Content-Type', 'text/html')
            res.end(html)
            return
          }
        }
        next()
      })
      
      server.middlewares.use('/ideas', (req, res, next) => {
        if (req.url && req.url.endsWith('.html')) {
          const slug = req.url.replace('.html', '').replace('/', '')
          const htmlFile = path.join(distDir, 'ideas', `${slug}.html`)
          
          if (fs.existsSync(htmlFile)) {
            const html = fs.readFileSync(htmlFile, 'utf-8')
            res.setHeader('Content-Type', 'text/html')
            res.end(html)
            return
          }
        }
        next()
      })
    }
  }
}
