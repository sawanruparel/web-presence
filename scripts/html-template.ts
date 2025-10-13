import fs from 'fs'
import path from 'path'

export interface MetaTag {
  name?: string
  property?: string
  content: string
}

export interface ContentData {
  title: string
  description: string
  body: string
  metaTags: MetaTag[]
  frontmatter: any
}

/**
 * Extract meta tags from rivve's generated HTML
 */
export function extractMetaTags(htmlContent: string): MetaTag[] {
  const metaTags: MetaTag[] = []
  
  // Extract title
  const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/)
  if (titleMatch) {
    metaTags.push({ name: 'title', content: titleMatch[1] })
  }
  
  // Extract meta tags
  const metaRegex = /<meta\s+([^>]*?)>/g
  let match
  
  while ((match = metaRegex.exec(htmlContent)) !== null) {
    const metaContent = match[1]
    const nameMatch = metaContent.match(/name="([^"]*?)"/)
    const propertyMatch = metaContent.match(/property="([^"]*?)"/)
    const contentMatch = metaContent.match(/content="([^"]*?)"/)
    
    if (contentMatch) {
      const content = contentMatch[1]
      if (nameMatch) {
        metaTags.push({ name: nameMatch[1], content })
      } else if (propertyMatch) {
        metaTags.push({ property: propertyMatch[1], content })
      }
    }
  }
  
  return metaTags
}

/**
 * Extract body content from rivve's generated HTML
 */
export function extractBodyContent(htmlContent: string): string {
  // Try to extract content from the .content div first
  const contentMatch = htmlContent.match(/<div class="content">([\s\S]*?)<\/div>/)
  if (contentMatch) {
    return contentMatch[1].trim()
  }
  
  // Fallback: extract content between <body> and </body>
  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/)
  if (bodyMatch) {
    return bodyMatch[1].trim()
  }
  
  return htmlContent
}

/**
 * Generate HTML template that combines React layout with rivve content
 */
export function generateHTMLTemplate(contentData: ContentData): string {
  const { title, description, body, metaTags, frontmatter } = contentData
  
  // Generate meta tags HTML
  const metaTagsHTML = metaTags.map(tag => {
    if (tag.name) {
      return `    <meta name="${escapeHtml(tag.name)}" content="${escapeHtml(tag.content)}">`
    } else if (tag.property) {
      return `    <meta property="${escapeHtml(tag.property)}" content="${escapeHtml(tag.content)}">`
    }
    return ''
  }).filter(Boolean).join('\n')
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="robots" content="index, follow">
    <meta name="generator" content="Rivve + Vite">
    <meta name="theme-color" content="#007bff">
    <link rel="canonical" href="${frontmatter?.canonical_url || `http://localhost:3000/${frontmatter?.slug || 'content'}.html`}">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    
    ${metaTagsHTML}
    
    <!-- App Styles -->
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
    <div id="app" class="app-container">
        <!-- React navbar will be rendered here -->
        <div class="content-wrapper">
            <main class="content">
                ${body}
            </main>
        </div>
        <!-- React footer will be rendered here -->
    </div>
    
    <!-- React app will hydrate here -->
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>`
}

/**
 * Process rivve HTML file and extract content data
 */
export function processRivveHTML(htmlFilePath: string, frontmatter: any): ContentData {
  const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8')
  
  const metaTags = extractMetaTags(htmlContent)
  const body = extractBodyContent(htmlContent)
  
  // Extract title and description from meta tags
  const titleTag = metaTags.find(tag => tag.name === 'title')
  const descriptionTag = metaTags.find(tag => tag.name === 'description')
  
  return {
    title: titleTag?.content || frontmatter?.title || 'Untitled',
    description: descriptionTag?.content || frontmatter?.description || '',
    body,
    metaTags,
    frontmatter
  }
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}
