import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { marked } from 'marked'
import { parse } from 'yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const contentDir = path.join(__dirname, '..', 'content')
const protectedContentDir = path.join(__dirname, '..', 'content-protected')
const distDir = path.join(__dirname, '..', 'dist')
const tempContentDir = path.join(__dirname, '..', 'temp-content')
const rivveOutputDir = path.join(__dirname, '..', 'rivve', 'html-output')

// Ensure directories exist
if (!fs.existsSync(tempContentDir)) {
  fs.mkdirSync(tempContentDir, { recursive: true })
}
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true })
}

// Create content subdirectories
const contentTypes = ['notes', 'publications', 'ideas', 'pages']
contentTypes.forEach(type => {
  const typeDir = path.join(tempContentDir, type)
  if (!fs.existsSync(typeDir)) {
    fs.mkdirSync(typeDir, { recursive: true })
  }
})

function parseFrontmatter(content) {
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

function extractMetaTags(htmlContent) {
  const metaTags = []
  const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/)
  const descriptionMatch = htmlContent.match(/<meta name="description" content="(.*?)">/)
  const ogTitleMatch = htmlContent.match(/<meta property="og:title" content="(.*?)">/)
  const ogDescriptionMatch = htmlContent.match(/<meta property="og:description" content="(.*?)">/)
  const twitterTitleMatch = htmlContent.match(/<meta name="twitter:title" content="(.*?)">/)
  const twitterDescriptionMatch = htmlContent.match(/<meta name="twitter:description" content="(.*?)">/)
  
  if (titleMatch) metaTags.push({ name: 'title', content: titleMatch[1] })
  if (descriptionMatch) metaTags.push({ name: 'description', content: descriptionMatch[1] })
  if (ogTitleMatch) metaTags.push({ property: 'og:title', content: ogTitleMatch[1] })
  if (ogDescriptionMatch) metaTags.push({ property: 'og:description', content: ogDescriptionMatch[1] })
  if (twitterTitleMatch) metaTags.push({ name: 'twitter:title', content: twitterTitleMatch[1] })
  if (twitterDescriptionMatch) metaTags.push({ name: 'twitter:description', content: twitterDescriptionMatch[1] })
  
  return metaTags
}

function extractBodyContent(htmlContent) {
  // Extract content between <div class="content"> and </div>
  const bodyMatch = htmlContent.match(/<div class="content">([\s\S]*?)<\/div>/)
  if (bodyMatch) {
    return bodyMatch[1].trim()
  }
  
  // Fallback: extract content between <body> and </body>
  const bodyFallback = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/)
  if (bodyFallback) {
    return bodyFallback[1].trim()
  }
  
  return htmlContent
}

function processMarkdownFiles() {
  const allContent = {}
  const contentMetadata = {}
  const protectedContent = {}

  // Process public content
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
      const { frontmatter, body } = parseFrontmatter(fileContents)
      
      // Generate excerpt
      const excerpt = body.split('\n\n')[0]?.replace(/[#*]/g, '').trim().substring(0, 150) + '...'
      
      // Convert markdown to HTML
      const html = marked(body)
      
      // Remove the first h1 tag from HTML since we'll display the title separately
      const htmlWithoutTitle = html.replace(/<h1[^>]*>.*?<\/h1>\s*/i, '')
      
      // Clean up title by removing type prefixes
      let cleanTitle = frontmatter?.title || slug
      const typePrefixes = ['Idea: ', 'Publication: ', 'Note: ']
      for (const prefix of typePrefixes) {
        if (cleanTitle.startsWith(prefix)) {
          cleanTitle = cleanTitle.substring(prefix.length)
          break
        }
      }

      const contentItem = {
        slug,
        title: cleanTitle,
        date: frontmatter?.date || new Date().toISOString().split('T')[0],
        readTime: frontmatter?.readTime || '1 min',
        type: frontmatter?.type || type.slice(0, -1),
        content: body,
        html: htmlWithoutTitle,
        excerpt,
        isProtected: false
      }

      typeContent.push(contentItem)
      typeMetadata.push({
        slug,
        title: contentItem.title,
        date: contentItem.date,
        readTime: contentItem.readTime,
        type: contentItem.type,
        excerpt: contentItem.excerpt,
        content: contentItem.content,
        html: contentItem.html,
        isProtected: false
      })

      // Generate individual HTML file using rivve's approach for the Vite plugin
      const rivveHtml = generateRivveHTML(frontmatter, body, slug)
      const rivveOutputDir = path.join(__dirname, '..', 'rivve', 'html-output')
      if (!fs.existsSync(rivveOutputDir)) {
        fs.mkdirSync(rivveOutputDir, { recursive: true })
      }
      const htmlFile = path.join(rivveOutputDir, `${slug}.html`)
      fs.writeFileSync(htmlFile, rivveHtml, 'utf8')
    })

    allContent[type] = typeContent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    contentMetadata[type] = typeMetadata.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })

  // Process protected content
  contentTypes.forEach(type => {
    const protectedTypeDir = path.join(protectedContentDir, type)
    
    if (!fs.existsSync(protectedTypeDir)) {
      protectedContent[type] = []
      return
    }

    const files = fs.readdirSync(protectedTypeDir).filter(file => file.endsWith('.md'))
    const typeProtectedContent = []

    files.forEach(file => {
      const slug = file.replace('.md', '')
      const filePath = path.join(protectedTypeDir, file)
      const fileContents = fs.readFileSync(filePath, 'utf8')
      const { frontmatter, body } = parseFrontmatter(fileContents)
      
      // Only process if marked as protected
      if (!frontmatter?.protected) {
        return
      }
      
      // Generate excerpt
      const excerpt = body.split('\n\n')[0]?.replace(/[#*]/g, '').trim().substring(0, 150) + '...'
      
      // Convert markdown to HTML
      const html = marked(body)
      
      // Remove the first h1 tag from HTML since we'll display the title separately
      const htmlWithoutTitle = html.replace(/<h1[^>]*>.*?<\/h1>\s*/i, '')
      
      // Clean up title by removing type prefixes
      let cleanTitle = frontmatter?.title || slug
      const typePrefixes = ['Idea: ', 'Publication: ', 'Note: ']
      for (const prefix of typePrefixes) {
        if (cleanTitle.startsWith(prefix)) {
          cleanTitle = cleanTitle.substring(prefix.length)
          break
        }
      }

      const protectedItem = {
        slug,
        title: cleanTitle,
        date: frontmatter?.date || new Date().toISOString().split('T')[0],
        readTime: frontmatter?.readTime || '1 min',
        type: frontmatter?.type || type.slice(0, -1),
        content: body,
        html: htmlWithoutTitle,
        excerpt,
        isProtected: true
      }

      typeProtectedContent.push(protectedItem)

      // Do NOT add protected content to public metadata
      // Protected content is only available through the backend API
    })

    protectedContent[type] = typeProtectedContent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })

  // Write content index for React app
  const contentIndex = {
    notes: contentMetadata.notes,
    publications: contentMetadata.publications,
    ideas: contentMetadata.ideas,
    pages: contentMetadata.pages,
    latest: [...contentMetadata.notes, ...contentMetadata.publications, ...contentMetadata.ideas]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3)
  }

  // Write protected content for backend
  const protectedContentIndex = {
    notes: protectedContent.notes || [],
    publications: protectedContent.publications || [],
    ideas: protectedContent.ideas || [],
    pages: protectedContent.pages || []
  }

  // Write metadata index for content processor to dist directory
  fs.writeFileSync(
    path.join(distDir, 'content-metadata.json'),
    JSON.stringify(contentIndex, null, 2)
  )

  // Write protected content for backend (not bundled with frontend)
  fs.writeFileSync(
    path.join(distDir, 'protected-content.json'),
    JSON.stringify(protectedContentIndex, null, 2)
  )

  // Also write to src directory for development
  const srcDataDir = path.join(__dirname, '..', 'src', 'data')
  if (!fs.existsSync(srcDataDir)) {
    fs.mkdirSync(srcDataDir, { recursive: true })
  }
  fs.writeFileSync(
    path.join(srcDataDir, 'content-metadata.json'),
    JSON.stringify(contentIndex, null, 2)
  )

  console.log('Static content generated successfully!')
  console.log(`- Notes: ${allContent.notes.length}`)
  console.log(`- Publications: ${allContent.publications.length}`)
  console.log(`- Ideas: ${allContent.ideas.length}`)
  console.log(`- Pages: ${allContent.pages.length}`)
  console.log(`- Protected content written to protected-content.json`)
}

function generateRivveHTML(frontmatter, body, slug) {
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
    <meta name="robots" content="index, follow">
    <meta name="author" content="${escapeHtml(author)}">
    <meta name="generator" content="Rivve">
    <meta name="theme-color" content="#007bff">
    <link rel="canonical" href="${frontmatter?.canonical_url || `http://localhost:3000/${slug}.html`}">
    ${keywords.length > 0 ? `<meta name="keywords" content="${keywords.map(escapeHtml).join(', ')}">` : ''}
    <meta name="reading-time" content="${frontmatter?.reading_time || 0}">
    <meta name="article:published_time" content="${frontmatter?.date || new Date().toISOString().split('T')[0]}">
    <meta name="article:modified_time" content="${frontmatter?.lastmod || new Date().toISOString().split('T')[0]}">
    ${frontmatter?.tags && frontmatter.tags.length > 0 ? frontmatter.tags.map(tag => `<meta name="article:tag" content="${escapeHtml(tag)}">`).join('\n    ') : ''}
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${frontmatter?.og_type || 'article'}">
    <meta property="og:url" content="${frontmatter?.og_url || frontmatter?.canonical_url || `http://localhost:3000/${slug}.html`}">
    <meta property="og:title" content="${escapeHtml(frontmatter?.og_title || title)}">
    <meta property="og:description" content="${escapeHtml(frontmatter?.og_description || description)}">
    <meta property="og:site_name" content="Rivve">
    <meta property="og:locale" content="${frontmatter?.lang || 'en_US'}">
    ${frontmatter?.image ? `<meta property="og:image" content="${escapeHtml(frontmatter.image)}">` : ''}
    ${frontmatter?.image_alt ? `<meta property="og:image:alt" content="${escapeHtml(frontmatter.image_alt)}">` : ''}
    <meta property="article:author" content="${escapeHtml(author)}">
    <meta property="article:published_time" content="${frontmatter?.date || new Date().toISOString().split('T')[0]}">
    <meta property="article:modified_time" content="${frontmatter?.lastmod || new Date().toISOString().split('T')[0]}">
    
    <!-- X (Twitter) -->
    <meta name="twitter:card" content="${frontmatter?.x_card || 'summary'}">
    <meta name="twitter:url" content="${frontmatter?.og_url || frontmatter?.canonical_url || `http://localhost:3000/${slug}.html`}">
    <meta name="twitter:title" content="${escapeHtml(frontmatter?.x_title || frontmatter?.og_title || title)}">
    <meta name="twitter:description" content="${escapeHtml(frontmatter?.x_description || frontmatter?.og_description || description)}">
    ${frontmatter?.x_image || frontmatter?.image ? `<meta name="twitter:image" content="${escapeHtml(frontmatter?.x_image || frontmatter?.image || '')}">` : ''}
    ${frontmatter?.x_site ? `<meta name="twitter:site" content="${escapeHtml(frontmatter.x_site)}">` : ''}
    ${frontmatter?.x_creator ? `<meta name="twitter:creator" content="${escapeHtml(frontmatter.x_creator)}">` : ''}
    
    <!-- LinkedIn -->
    <meta name="linkedin:title" content="${escapeHtml(frontmatter?.linkedin_title || frontmatter?.og_title || title)}">
    <meta name="linkedin:description" content="${escapeHtml(frontmatter?.linkedin_description || frontmatter?.og_description || description)}">
    ${frontmatter?.linkedin_image || frontmatter?.image ? `<meta name="linkedin:image" content="${escapeHtml(frontmatter?.linkedin_image || frontmatter?.image || '')}">` : ''}
    ${frontmatter?.linkedin_author ? `<meta name="linkedin:author" content="${escapeHtml(frontmatter.linkedin_author)}">` : ''}
    
    <!-- Additional SEO Meta Tags -->
    <meta name="format-detection" content="telephone=no">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="Rivve">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    
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
        .meta h3 {
            margin-top: 0;
            color: #666;
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
        ${frontmatter?.canonical_url ? `<p><strong>Canonical URL:</strong> <a href="${escapeHtml(frontmatter.canonical_url)}">${escapeHtml(frontmatter.canonical_url)}</a></p>` : ''}
        
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

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

// Run the script
processMarkdownFiles()
