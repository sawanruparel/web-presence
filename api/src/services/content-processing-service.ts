import { marked } from 'marked'
import matter from 'gray-matter'
import { AccessControlService } from './access-control-service'
import type { Env } from '../types/env'

export interface ProcessedContent {
  slug: string
  title: string
  date: string
  readTime: string
  type: string
  content: string
  html: string
  excerpt: string
  isProtected: boolean
  accessMode: 'open' | 'password' | 'email-list'
  requiresPassword: boolean
  requiresEmail: boolean
  frontmatter: Record<string, any>
}

export interface ContentMetadata {
  slug: string
  title: string
  date: string
  readTime: string
  type: string
  excerpt: string
  content: string
  html: string
}

export interface ProtectedContentMetadata {
  slug: string
  title: string
  accessMode: string
}

export class ContentProcessingService {
  private baseUrl: string
  private accessControlService?: AccessControlService

  constructor(baseUrl: string = 'https://sawanruparel.com', env?: Env) {
    this.baseUrl = baseUrl
    this.accessControlService = env ? new AccessControlService(env) : undefined
  }

  /**
   * Process a markdown file and convert to HTML
   */
  async processContentFile(
    filePath: string,
    content: string,
    accessRules?: Record<string, any>
  ): Promise<ProcessedContent> {
    // Parse frontmatter
    const { data: frontmatter, content: body } = matter(content)
    
    // Extract slug from filename
    const slug = this.extractSlug(filePath)
    const type = this.extractType(filePath)
    
    // Clean title
    const cleanTitle = this.cleanTitle(frontmatter?.title || slug)
    
    // Convert markdown to HTML
    const html = this.convertMarkdownToHtml(body, frontmatter)
    
    // Generate excerpt
    const excerpt = this.generateExcerpt(body, frontmatter?.excerpt)
    
    // Determine access mode
    const { isProtected, accessMode } = await this.determineAccessMode(
      filePath,
      frontmatter,
      accessRules
    )

    return {
      slug,
      title: cleanTitle,
      date: frontmatter?.date || new Date().toISOString().split('T')[0],
      readTime: frontmatter?.readTime || this.calculateReadTime(body),
      type: frontmatter?.type || type,
      content: body,
      html: this.removeTitleFromHtml(html, cleanTitle),
      excerpt,
      isProtected,
      accessMode,
      requiresPassword: accessMode === 'password',
      requiresEmail: accessMode === 'email-list',
      frontmatter
    }
  }

  /**
   * Generate HTML template for public content
   */
  generatePublicHtmlTemplate(
    content: ProcessedContent,
    jsAsset?: string,
    cssAsset?: string
  ): string {
    const { slug, title, html, excerpt, frontmatter } = content
    
    return `<!DOCTYPE html>
<html lang="${frontmatter?.lang || 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(title)}</title>
    <meta name="description" content="${this.escapeHtml(excerpt)}">
    <meta name="robots" content="index, follow">
    <meta name="author" content="${this.escapeHtml(Array.isArray(frontmatter?.author) ? frontmatter.author.join(', ') : frontmatter?.author || 'Unknown Author')}">
    <meta name="generator" content="Web Presence CMS">
    <meta name="theme-color" content="#007bff">
    <link rel="canonical" href="${frontmatter?.canonical_url || `${this.baseUrl}/${slug}.html`}">
    <meta name="reading-time" content="${frontmatter?.reading_time || 0}">
    <meta name="article:published_time" content="${frontmatter?.date || new Date().toISOString().split('T')[0]}">
    <meta name="article:modified_time" content="${frontmatter?.lastmod || new Date().toISOString().split('T')[0]}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${frontmatter?.og_type || 'article'}">
    <meta property="og:url" content="${frontmatter?.og_url || frontmatter?.canonical_url || `${this.baseUrl}/${slug}.html`}">
    <meta property="og:title" content="${this.escapeHtml(title)}">
    <meta property="og:description" content="${this.escapeHtml(excerpt)}">
    <meta property="og:image" content="${frontmatter?.og_image || `${this.baseUrl}/og-image.jpg`}">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${frontmatter?.og_url || frontmatter?.canonical_url || `${this.baseUrl}/${slug}.html`}">
    <meta property="twitter:title" content="${this.escapeHtml(title)}">
    <meta property="twitter:description" content="${this.escapeHtml(excerpt)}">
    <meta property="twitter:image" content="${frontmatter?.og_image || `${this.baseUrl}/og-image.jpg`}">
    
    ${cssAsset ? `<link rel="stylesheet" href="${cssAsset}">` : ''}
</head>
<body>
    <main>
        <article>
            <header>
                <h1>${this.escapeHtml(title)}</h1>
                <div class="meta">
                    <time datetime="${frontmatter?.date || new Date().toISOString().split('T')[0]}">
                        ${new Date(frontmatter?.date || new Date()).toLocaleDateString()}
                    </time>
                    <span class="read-time">${content.readTime} read</span>
                </div>
            </header>
            <div class="content">
                ${html}
            </div>
        </article>
    </main>
    ${jsAsset ? `<script src="${jsAsset}"></script>` : ''}
</body>
</html>`
  }

  /**
   * Convert markdown to HTML with proper URL handling
   */
  private convertMarkdownToHtml(markdown: string, frontmatter: Record<string, any>): string {
    // Configure marked with proper URL handling
    marked.setOptions({
      breaks: true,
      gfm: true,
      baseUrl: this.baseUrl
    })

    return marked(markdown)
  }

  /**
   * Extract slug from file path
   */
  private extractSlug(filePath: string): string {
    const filename = filePath.split('/').pop() || ''
    return filename.replace(/\.md$/, '')
  }

  /**
   * Extract content type from file path
   */
  private extractType(filePath: string): string {
    const parts = filePath.split('/')
    const typeIndex = parts.indexOf('content')
    if (typeIndex >= 0 && typeIndex + 1 < parts.length) {
      return parts[typeIndex + 1].replace(/s$/, '') // Remove 's' from 'notes' -> 'note'
    }
    return 'page'
  }

  /**
   * Clean title for display
   */
  private cleanTitle(title: string): string {
    return title.replace(/[#*`]/g, '').trim()
  }

  /**
   * Generate excerpt from content
   */
  private generateExcerpt(content: string, customExcerpt?: string): string {
    if (customExcerpt) {
      return customExcerpt
    }

    // Remove markdown formatting and get first 160 characters
    const plainText = content
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim()

    return plainText.length > 160 
      ? plainText.substring(0, 160) + '...'
      : plainText
  }

  /**
   * Calculate reading time
   */
  private calculateReadTime(content: string): string {
    const wordsPerMinute = 200
    const wordCount = content.split(/\s+/).length
    const minutes = Math.ceil(wordCount / wordsPerMinute)
    return `${minutes} min`
  }

  /**
   * Remove title from HTML if it's the first h1
   */
  private removeTitleFromHtml(html: string, title: string): string {
    // Remove the first h1 if it matches the title
    const titleRegex = new RegExp(`<h1[^>]*>${this.escapeHtml(title)}</h1>`, 'i')
    return html.replace(titleRegex, '').trim()
  }

  /**
   * Determine access mode for content
   */
  private async determineAccessMode(
    filePath: string,
    frontmatter: Record<string, any>,
    accessRules?: Record<string, any>
  ): Promise<{ isProtected: boolean; accessMode: 'open' | 'password' | 'email-list' }> {
    // Check if file is in protected directory or has protected frontmatter
    const isInProtectedFolder = filePath.includes('content-protected/')
    const hasProtectedFrontmatter = frontmatter?.protected === true

    if (!isInProtectedFolder && !hasProtectedFrontmatter) {
      return { isProtected: false, accessMode: 'open' }
    }

    const type = this.extractType(filePath)
    const slug = this.extractSlug(filePath)

    // Try database access control first
    if (this.accessControlService) {
      const dbRule = await this.accessControlService.getAccessRule(type, slug)
      if (dbRule) {
        return {
          isProtected: true,
          accessMode: dbRule.accessMode
        }
      }
    }

    // Fallback to provided access rules
    if (accessRules?.[type]?.[slug]) {
      const rule = accessRules[type][slug]
      return {
        isProtected: true,
        accessMode: rule.mode || 'password'
      }
    }

    // Default to password protection
    return {
      isProtected: true,
      accessMode: frontmatter?.accessMode || 'password'
    }
  }

  /**
   * Escape HTML characters
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * Generate content metadata for public content
   */
  generateContentMetadata(processedContent: ProcessedContent[]): Record<string, ContentMetadata[]> {
    const metadata: Record<string, ContentMetadata[]> = {}

    for (const content of processedContent) {
      if (!content.isProtected) {
        if (!metadata[content.type]) {
          metadata[content.type] = []
        }

        metadata[content.type].push({
          slug: content.slug,
          title: content.title,
          date: content.date,
          readTime: content.readTime,
          type: content.type,
          excerpt: content.excerpt,
          content: content.content,
          html: content.html
        })
      }
    }

    return metadata
  }

  /**
   * Generate protected content metadata
   */
  generateProtectedContentMetadata(processedContent: ProcessedContent[]): Record<string, ProtectedContentMetadata[]> {
    const metadata: Record<string, ProtectedContentMetadata[]> = {}

    for (const content of processedContent) {
      if (content.isProtected) {
        if (!metadata[content.type]) {
          metadata[content.type] = []
        }

        metadata[content.type].push({
          slug: content.slug,
          title: content.title,
          accessMode: content.accessMode
        })
      }
    }

    return metadata
  }
}
