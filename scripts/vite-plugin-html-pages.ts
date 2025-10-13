import { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'
import { generateHTMLTemplate, processRivveHTML, ContentData } from './html-template'

export interface HTMLPagesPluginOptions {
  contentDir: string
  outputDir: string
  rivveOutputDir: string
}

export function htmlPagesPlugin(options: HTMLPagesPluginOptions): Plugin {
  const { contentDir, outputDir, rivveOutputDir } = options
  
  return {
    name: 'html-pages',
    buildStart() {
      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }
    },
    generateBundle() {
      try {
        // Read content metadata
        const metadataPath = path.join(outputDir, 'content-metadata.json')
        if (!fs.existsSync(metadataPath)) {
          console.warn('Content metadata not found. Run build:content first.')
          return
        }
        
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
        
        // Process each content type
        const contentTypes = ['notes', 'publications', 'ideas']
        
        contentTypes.forEach(type => {
          const typeContent = metadata[type] || []
          const typeDir = path.join(outputDir, type)
          
          // Ensure type directory exists
          if (!fs.existsSync(typeDir)) {
            fs.mkdirSync(typeDir, { recursive: true })
          }
          
          typeContent.forEach((item: any) => {
            const { slug } = item
            
            // Try to find rivve HTML file
            const rivveHtmlPath = path.join(rivveOutputDir, `${slug}.html`)
            
            if (fs.existsSync(rivveHtmlPath)) {
              // Process rivve HTML and generate template
              const contentData = processRivveHTML(rivveHtmlPath, item)
              const html = generateHTMLTemplate(contentData)
              
              // Write to output directory
              const outputPath = path.join(typeDir, `${slug}.html`)
              fs.writeFileSync(outputPath, html, 'utf-8')
              
              console.log(`Generated HTML page: ${type}/${slug}.html`)
            } else {
              console.warn(`Rivve HTML not found for ${type}/${slug}`)
            }
          })
        })
        
        // Generate index page
        this.generateIndexPage(metadata)
        
      } catch (error) {
        console.error('Error generating HTML pages:', error)
      }
    },
    
    generateIndexPage(metadata: any) {
      const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web Presence</title>
    <meta name="description" content="Personal website with notes, publications, and ideas">
    <meta name="robots" content="index, follow">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="stylesheet" href="/src/style.css">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            color: #333;
        }
        .app-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .content-wrapper {
            flex: 1;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div id="app" class="app-container">
        <!-- React app will render here -->
    </div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>`
      
      fs.writeFileSync(path.join(outputDir, 'index.html'), indexHtml, 'utf-8')
      console.log('Generated index.html')
    }
  }
}

export default htmlPagesPlugin
