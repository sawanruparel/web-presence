# Build System Patterns for AI Tools

This document provides comprehensive patterns and conventions for the build system in the Web Presence project.

## 🏗️ Vite Configuration Patterns

### Plugin Configuration

**Always follow this pattern for Vite plugins:**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { htmlPagesPlugin } from './scripts/vite-plugin-html-pages'
import { devServerPlugin } from './scripts/dev-server-plugin'

export default defineConfig({
  plugins: [
    react(),
    htmlPagesPlugin({
      contentDir: './content',
      outputDir: './dist',
      rivveOutputDir: './rivve/html-output'
    }),
    devServerPlugin('./content', './rivve/html-output')
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
    middlewareMode: false,
    fs: {
      allow: ['..']
    }
  }
})
```

### Custom Plugin Structure

**Use this pattern for custom Vite plugins:**

```typescript
import { Plugin } from 'vite'

export interface CustomPluginOptions {
  inputDir: string
  outputDir: string
  watch?: boolean
}

export function customPlugin(options: CustomPluginOptions): Plugin {
  const { inputDir, outputDir, watch = false } = options
  
  return {
    name: 'custom-plugin',
    buildStart() {
      // Plugin initialization
      console.log(`Custom plugin started: ${inputDir} -> ${outputDir}`)
    },
    buildEnd() {
      // Build completion logic
      console.log('Custom plugin build completed')
    },
    generateBundle() {
      // Bundle generation logic
      this.emitFile({
        type: 'asset',
        fileName: 'custom-data.json',
        source: JSON.stringify({ custom: 'data' })
      })
    },
    configureServer(server) {
      if (watch) {
        // Development server configuration
        server.middlewares.use('/api/custom', (req, res, next) => {
          // Custom middleware
          next()
        })
      }
    }
  }
}
```

## 📦 Content Processing Patterns

### Content Generation Script

**Follow this pattern for content processing scripts:**

```typescript
// scripts/fetch-content-from-r2.ts
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { marked } from 'marked'
import { parse } from 'yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const contentDir = path.join(__dirname, '..', 'content')
const distDir = path.join(__dirname, '..', 'dist')
const outputDir = path.join(__dirname, '..', 'dist')
const rivveOutputDir = path.join(__dirname, '..', 'rivve', 'html-output')

// Content types
const contentTypes = ['notes', 'publications', 'ideas', 'pages']

// Ensure directories exist
function ensureDirectories() {
  const dirs = [tempContentDir, distDir, rivveOutputDir]
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })
  
  // Create content subdirectories
  contentTypes.forEach(type => {
    const typeDir = path.join(tempContentDir, type)
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true })
    }
  })
}

// Main processing function
function processMarkdownFiles() {
  const allContent = {}
  const contentMetadata = {}

  contentTypes.forEach(type => {
    const typeDir = path.join(contentDir, type)
    const distTypeDir = path.join(tempContentDir, type)
    
    if (!fs.existsSync(typeDir)) {
      allContent[type] = []
      contentMetadata[type] = []
      return
    }

    const files = fs.readdirSync(typeDir).filter(file => file.endsWith('.md'))
    const typeContent = []
    const typeMetadata = []

    files.forEach(file => {
      const slug = file.replace('.md', '')
      const filePath = path.join(typeDir, file)
      const fileContents = fs.readFileSync(filePath, 'utf8')
      
      // Process content
      const contentItem = processContentFile(fileContents, slug, type)
      
      typeContent.push(contentItem)
      typeMetadata.push(createMetadataItem(contentItem))
      
      // Generate Rivve HTML
      generateRivveHTML(contentItem, rivveOutputDir)
    })

    allContent[type] = typeContent.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    contentMetadata[type] = typeMetadata.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  })

  // Write metadata files
  writeMetadataFiles(contentMetadata, distDir)
  
  console.log('Content processing completed!')
  logContentStats(allContent)
}

// Run the script
ensureDirectories()
processMarkdownFiles()
```

### Content File Processing

**Use this pattern for processing individual content files:**

```typescript
function processContentFile(fileContents: string, slug: string, type: string) {
  const { frontmatter, body } = parseFrontmatter(fileContents)
  
  // Generate excerpt
  const excerpt = generateExcerpt(body)
  
  // Convert markdown to HTML
  const html = marked(body)
  
  // Remove first h1 tag
  const htmlWithoutTitle = html.replace(/<h1[^>]*>.*?<\/h1>\s*/i, '')
  
  // Clean title
  const cleanTitle = cleanContentTitle(frontmatter?.title || slug)
  
  return {
    slug,
    title: cleanTitle,
    date: frontmatter?.date || new Date().toISOString().split('T')[0],
    readTime: frontmatter?.readTime || '1 min',
    type: frontmatter?.type || type.slice(0, -1),
    content: body,
    html: htmlWithoutTitle,
    excerpt,
    frontmatter
  }
}
```

### Frontmatter Parsing

**Always use this pattern for frontmatter parsing:**

```typescript
function parseFrontmatter(content: string) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  
  if (!frontmatterMatch) {
    return { frontmatter: null, body: content }
  }
  
  const frontmatterYaml = frontmatterMatch[1]
  const body = frontmatterMatch[2]
  
  try {
    const frontmatter = parse(frontmatterYaml)
    return { frontmatter, body }
  } catch (error) {
    console.warn('Warning: Could not parse frontmatter YAML:', error)
    return { frontmatter: null, body: content }
  }
}
```

## 🔧 HTML Generation Patterns

### HTML Template Generation

**Use this pattern for HTML template generation:**

```typescript
// scripts/html-template.ts
export interface ContentData {
  title: string
  description: string
  content: string
  metaTags: MetaTag[]
  assets: {
    js: string
    css: string
  }
}

export function generateHTMLTemplate(
  contentData: ContentData,
  assets: { js: string; css: string }
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(contentData.title)}</title>
    <meta name="description" content="${escapeHtml(contentData.description)}">
    
    <!-- Meta Tags -->
    ${contentData.metaTags.map(tag => 
      `<meta ${tag.name ? `name="${tag.name}"` : ''} ${tag.property ? `property="${tag.property}"` : ''} content="${escapeHtml(tag.content)}">`
    ).join('\n    ')}
    
    <!-- Assets -->
    <link rel="stylesheet" href="${assets.css}">
    <script type="module" src="${assets.js}"></script>
    
    <!-- Styles -->
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        .content {
            line-height: 1.8;
        }
        .content h1, .content h2, .content h3 {
            color: #2c3e50;
        }
        .content code {
            background: #f1f3f4;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        .content pre {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div class="content">
        ${contentData.content}
    </div>
</body>
</html>`
}
```

### Rivve HTML Generation

**Use this pattern for Rivve HTML generation:**

```typescript
function generateRivveHTML(frontmatter: any, body: string, slug: string): string {
  const title = frontmatter?.title || slug
  const description = frontmatter?.description || ''
  const author = Array.isArray(frontmatter?.author) 
    ? frontmatter.author.join(', ') 
    : frontmatter?.author || 'Unknown Author'
  
  const tags = frontmatter?.tags || []
  const categories = frontmatter?.categories || []
  const keywords = frontmatter?.keywords || []
  
  // Convert markdown to HTML
  const htmlContent = marked(body)
  
  return `<!DOCTYPE html>
<html lang="${frontmatter?.lang || 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    
    <!-- SEO Meta Tags -->
    <meta name="robots" content="index, follow">
    <meta name="author" content="${escapeHtml(author)}">
    <meta name="generator" content="Rivve">
    <meta name="theme-color" content="#007bff">
    <link rel="canonical" href="${frontmatter?.canonical_url || `http://localhost:3000/${slug}.html`}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${frontmatter?.og_type || 'article'}">
    <meta property="og:url" content="${frontmatter?.og_url || frontmatter?.canonical_url || `http://localhost:3000/${slug}.html`}">
    <meta property="og:title" content="${escapeHtml(frontmatter?.og_title || title)}">
    <meta property="og:description" content="${escapeHtml(frontmatter?.og_description || description)}">
    <meta property="og:site_name" content="Rivve">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="${frontmatter?.x_card || 'summary'}">
    <meta name="twitter:url" content="${frontmatter?.og_url || frontmatter?.canonical_url || `http://localhost:3000/${slug}.html`}">
    <meta name="twitter:title" content="${escapeHtml(frontmatter?.x_title || frontmatter?.og_title || title)}">
    <meta name="twitter:description" content="${escapeHtml(frontmatter?.x_description || frontmatter?.og_description || description)}">
    
    <!-- Additional Meta Tags -->
    ${keywords.length > 0 ? `<meta name="keywords" content="${keywords.map(escapeHtml).join(', ')}">` : ''}
    <meta name="reading-time" content="${frontmatter?.reading_time || 0}">
    <meta name="article:published_time" content="${frontmatter?.date || new Date().toISOString().split('T')[0]}">
    <meta name="article:modified_time" content="${frontmatter?.lastmod || new Date().toISOString().split('T')[0]}">
    
    <!-- Styles -->
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        .header {
            border-bottom: 1px solid #eee;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .meta {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
        }
        .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 10px 0;
        }
        .tag {
            background: #007bff;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
        }
        .content {
            line-height: 1.8;
        }
        .content h1, .content h2, .content h3 {
            color: #2c3e50;
        }
        .content code {
            background: #f1f3f4;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        .content pre {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
        }
        .content blockquote {
            border-left: 4px solid #007bff;
            margin: 0;
            padding-left: 20px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${escapeHtml(title)}</h1>
        ${description ? `<p class="description">${escapeHtml(description)}</p>` : ''}
    </div>
    
    <div class="meta">
        <h3>Article Metadata</h3>
        <p><strong>Author:</strong> ${escapeHtml(author)}</p>
        <p><strong>Published:</strong> ${frontmatter?.date || 'Not specified'}</p>
        <p><strong>Last Modified:</strong> ${frontmatter?.lastmod || 'Not specified'}</p>
        <p><strong>Reading Time:</strong> ${frontmatter?.reading_time || 0} minutes</p>
        <p><strong>Status:</strong> ${frontmatter?.draft ? 'Draft' : 'Published'}</p>
        
        ${tags.length > 0 ? `
        <h4>Tags</h4>
        <div class="tags">
            ${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
        ` : ''}
        
        ${categories.length > 0 ? `
        <h4>Categories</h4>
        <div class="tags">
            ${categories.map(cat => `<span class="tag">${escapeHtml(cat)}</span>`).join('')}
        </div>
        ` : ''}
        
        ${keywords.length > 0 ? `
        <h4>Keywords</h4>
        <p>${keywords.map(escapeHtml).join(', ')}</p>
        ` : ''}
    </div>
    
    <div class="content">
        ${htmlContent}
    </div>
</body>
</html>`
}
```

## 🚀 Build Optimization Patterns

### Asset Optimization

**Implement asset optimization:**

```typescript
function optimizeAssets(buildDir: string) {
  const assetsDir = path.join(buildDir, 'assets')
  
  if (!fs.existsSync(assetsDir)) {
    console.warn('Assets directory not found')
    return
  }
  
  const assetFiles = fs.readdirSync(assetsDir)
  
  // Optimize CSS files
  const cssFiles = assetFiles.filter(file => file.endsWith('.css'))
  cssFiles.forEach(file => {
    const filePath = path.join(assetsDir, file)
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Remove unused CSS (basic implementation)
    const optimizedContent = removeUnusedCSS(content)
    fs.writeFileSync(filePath, optimizedContent)
  })
  
  // Optimize JS files
  const jsFiles = assetFiles.filter(file => file.endsWith('.js'))
  jsFiles.forEach(file => {
    const filePath = path.join(assetsDir, file)
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Minify JS (basic implementation)
    const optimizedContent = minifyJS(content)
    fs.writeFileSync(filePath, optimizedContent)
  })
  
  console.log('Assets optimized successfully')
}
```

### Bundle Analysis

**Implement bundle analysis:**

```typescript
function analyzeBundle(buildDir: string) {
  const assetsDir = path.join(buildDir, 'assets')
  
  if (!fs.existsSync(assetsDir)) {
    console.warn('Assets directory not found')
    return
  }
  
  const assetFiles = fs.readdirSync(assetsDir)
  const analysis = {
    totalSize: 0,
    files: [],
    largestFiles: [],
    recommendations: []
  }
  
  assetFiles.forEach(file => {
    const filePath = path.join(assetsDir, file)
    const stats = fs.statSync(filePath)
    const sizeKB = Math.round(stats.size / 1024)
    
    analysis.totalSize += stats.size
    analysis.files.push({
      name: file,
      size: stats.size,
      sizeKB
    })
  })
  
  // Sort by size
  analysis.files.sort((a, b) => b.size - a.size)
  analysis.largestFiles = analysis.files.slice(0, 5)
  
  // Generate recommendations
  if (analysis.totalSize > 1024 * 1024) { // 1MB
    analysis.recommendations.push('Consider code splitting to reduce bundle size')
  }
  
  const largeFiles = analysis.files.filter(f => f.sizeKB > 100)
  if (largeFiles.length > 0) {
    analysis.recommendations.push(`Large files detected: ${largeFiles.map(f => f.name).join(', ')}`)
  }
  
  console.log('Bundle Analysis:')
  console.log(`Total size: ${Math.round(analysis.totalSize / 1024)}KB`)
  console.log('Largest files:', analysis.largestFiles)
  console.log('Recommendations:', analysis.recommendations)
  
  return analysis
}
```

## 🔍 Development Server Patterns

### Dev Server Plugin

**Use this pattern for development server plugins:**

```typescript
// scripts/dev-server-plugin.ts
import { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'
import chokidar from 'chokidar'

export function devServerPlugin(
  contentDir: string,
  rivveOutputDir: string
): Plugin {
  return {
    name: 'dev-server-plugin',
    configureServer(server) {
      // Watch content files
      const watcher = chokidar.watch(contentDir, {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true
      })
      
      watcher.on('change', (filePath) => {
        console.log(`Content file changed: ${filePath}`)
        
        // Regenerate content
        try {
          regenerateContent(filePath, rivveOutputDir)
          console.log('Content regenerated successfully')
        } catch (error) {
          console.error('Failed to regenerate content:', error)
        }
      })
      
      // Serve static HTML files
      server.middlewares.use('/content', (req, res, next) => {
        const filePath = path.join(rivveOutputDir, req.url)
        
        if (fs.existsSync(filePath)) {
          res.setHeader('Content-Type', 'text/html')
          res.end(fs.readFileSync(filePath, 'utf8'))
        } else {
          next()
        }
      })
    }
  }
}
```

### Hot Reload Implementation

**Implement hot reload for content changes:**

```typescript
function setupHotReload(server: any, contentDir: string) {
  const watcher = chokidar.watch(contentDir, {
    ignored: /(^|[\/\\])\../,
    persistent: true
  })
  
  watcher.on('change', (filePath) => {
    console.log(`Content changed: ${filePath}`)
    
    // Regenerate content
    regenerateContent(filePath, contentDir)
    
    // Notify client
    server.ws.send({
      type: 'content-updated',
      data: { filePath }
    })
  })
  
  watcher.on('add', (filePath) => {
    console.log(`Content added: ${filePath}`)
    
    // Regenerate content
    regenerateContent(filePath, contentDir)
    
    // Notify client
    server.ws.send({
      type: 'content-added',
      data: { filePath }
    })
  })
  
  watcher.on('unlink', (filePath) => {
    console.log(`Content removed: ${filePath}`)
    
    // Notify client
    server.ws.send({
      type: 'content-removed',
      data: { filePath }
    })
  })
}
```

## 🧪 Testing Build System

### Build Testing

**Test build system functionality:**

```typescript
function testBuildSystem() {
  console.log('Testing build system...')
  
  try {
    // Test content processing
    const contentDir = './content'
    const outputDir = './dist'
    
    if (!fs.existsSync(contentDir)) {
      throw new Error('Content directory not found')
    }
    
    // Process content
    const content = processMarkdownFiles(contentDir)
    
    if (!content || Object.keys(content).length === 0) {
      throw new Error('No content processed')
    }
    
    // Test HTML generation
    const htmlFiles = generateHTMLFiles(content, outputDir)
    
    if (htmlFiles.length === 0) {
      throw new Error('No HTML files generated')
    }
    
    // Test metadata generation
    const metadata = generateContentMetadata(content)
    
    if (!metadata || !metadata.notes || !metadata.publications) {
      throw new Error('Metadata generation failed')
    }
    
    console.log('Build system tests passed!')
    return true
    
  } catch (error) {
    console.error('Build system test failed:', error)
    return false
  }
}
```

### Content Validation

**Validate content during build:**

```typescript
function validateContent(content: any[]): ValidationResult {
  const errors: string[] = []
  
  content.forEach((item, index) => {
    // Required fields
    if (!item.title) {
      errors.push(`Item ${index}: Missing title`)
    }
    
    if (!item.date) {
      errors.push(`Item ${index}: Missing date`)
    }
    
    if (!item.type) {
      errors.push(`Item ${index}: Missing type`)
    }
    
    // Content validation
    if (!item.content || item.content.trim() === '') {
      errors.push(`Item ${index}: Empty content`)
    }
    
    // Date validation
    if (item.date && isNaN(Date.parse(item.date))) {
      errors.push(`Item ${index}: Invalid date format`)
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
```

## 📊 Build Monitoring

### Build Performance

**Monitor build performance:**

```typescript
function monitorBuildPerformance() {
  const startTime = Date.now()
  
  return {
    start: () => {
      console.log('Build started...')
      return Date.now()
    },
    end: (startTime: number) => {
      const endTime = Date.now()
      const duration = endTime - startTime
      console.log(`Build completed in ${duration}ms`)
      return duration
    },
    logStep: (step: string, startTime: number) => {
      const stepTime = Date.now() - startTime
      console.log(`${step}: ${stepTime}ms`)
    }
  }
}
```

### Build Statistics

**Generate build statistics:**

```typescript
function generateBuildStats(buildDir: string) {
  const stats = {
    totalFiles: 0,
    totalSize: 0,
    contentFiles: 0,
    assetFiles: 0,
    htmlFiles: 0
  }
  
  function scanDirectory(dir: string) {
    const files = fs.readdirSync(dir)
    
    files.forEach(file => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      
      if (stat.isDirectory()) {
        scanDirectory(filePath)
      } else {
        stats.totalFiles++
        stats.totalSize += stat.size
        
        if (file.endsWith('.html')) {
          stats.htmlFiles++
        } else if (file.endsWith('.js') || file.endsWith('.css')) {
          stats.assetFiles++
        } else if (file.endsWith('.md')) {
          stats.contentFiles++
        }
      }
    })
  }
  
  scanDirectory(buildDir)
  
  console.log('Build Statistics:')
  console.log(`Total files: ${stats.totalFiles}`)
  console.log(`Total size: ${Math.round(stats.totalSize / 1024)}KB`)
  console.log(`HTML files: ${stats.htmlFiles}`)
  console.log(`Asset files: ${stats.assetFiles}`)
  console.log(`Content files: ${stats.contentFiles}`)
  
  return stats
}
```

---

These build system patterns provide a solid foundation for creating and maintaining the build system in the Web Presence project.
