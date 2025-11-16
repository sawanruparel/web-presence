import { 
  convertMarkdownToHtml, 
  generateHtmlTemplate, 
  parseFrontmatter,
  removeTitleFromHtml,
  generateExcerpt as generateExcerptUtil,
  type Frontmatter
} from 'mdtohtml'
import { AccessControlService } from './access-control-service'
import { createDatabaseService } from './database-service'
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
  private databaseService?: any

  constructor(baseUrl: string = 'https://sawanruparel.com', env?: Env) {
    this.baseUrl = baseUrl
    this.accessControlService = env ? new AccessControlService(env) : undefined
    this.databaseService = env ? createDatabaseService(env.DB) : undefined
    
    console.log('🔍 ContentProcessingService constructor:')
    console.log('🔍 env provided:', !!env)
    console.log('🔍 env.DB provided:', !!env?.DB)
    console.log('🔍 databaseService created:', !!this.databaseService)
  }

  /**
   * Process a markdown file and convert to HTML
   */
  async processContentFile(
    filePath: string,
    content: string
  ): Promise<ProcessedContent> {
    // Parse frontmatter using mdtohtml
    const { frontmatter, body } = parseFrontmatter(content)
    
    // Extract slug from filename
    const slug = this.extractSlug(filePath)
    const type = this.extractType(filePath)
    
    // Clean title
    const cleanTitle = this.cleanTitle(frontmatter?.title || slug)
    
    // Convert markdown to HTML using mdtohtml
    const html = convertMarkdownToHtml(body)
    
    // Generate excerpt using mdtohtml
    const excerpt = frontmatter?.description || generateExcerptUtil(body, 160)
    
    // Determine access mode
    const { isProtected, accessMode } = await this.determineAccessMode(
      filePath,
      frontmatter || {}
    )

    return {
      slug,
      title: cleanTitle,
      date: frontmatter?.date || new Date().toISOString().split('T')[0],
      readTime: frontmatter?.reading_time ? `${frontmatter.reading_time} min` : this.calculateReadTime(body),
      type: frontmatter?.type || type,
      content: body,
      html: removeTitleFromHtml(html, cleanTitle),
      excerpt,
      isProtected,
      accessMode,
      requiresPassword: accessMode === 'password',
      requiresEmail: accessMode === 'email-list',
      frontmatter: frontmatter || {}
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
    const { html, frontmatter } = content
    
    // Use mdtohtml's generateHtmlTemplate
    return generateHtmlTemplate({
      frontmatter: frontmatter as Frontmatter,
      htmlContent: html,
      baseUrl: this.baseUrl,
      jsAsset,
      cssAsset,
      publisherName: 'Web Presence CMS'
    })
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
      return parts[typeIndex + 1] // Return directory name as-is (ideas, notes, pages, publications)
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
   * Calculate reading time
   */
  private calculateReadTime(content: string): string {
    const wordsPerMinute = 200
    const wordCount = content.split(/\s+/).length
    const minutes = Math.ceil(wordCount / wordsPerMinute)
    return `${minutes} min`
  }


  /**
   * Determine access mode for content
   */
  private async determineAccessMode(
    filePath: string,
    frontmatter: Record<string, any>
  ): Promise<{ isProtected: boolean; accessMode: 'open' | 'password' | 'email-list' }> {
    console.log(`🚨 DETERMINE ACCESS MODE CALLED FOR: ${filePath}`)
    
    // ONLY check database - single source of truth
    const type = this.extractType(filePath)
    const slug = this.extractSlug(filePath)
    
    console.log(`🔍 Checking access mode for ${type}/${slug}`)
    console.log(`🔍 DatabaseService available: ${!!this.databaseService}`)
    
    if (this.databaseService) {
      console.log(`🔍 Calling databaseService.getAccessRule with: ${type}/${slug}`)
      console.log(`🔍 databaseService type:`, typeof this.databaseService)
      console.log(`🔍 databaseService.getAccessRule type:`, typeof this.databaseService.getAccessRule)
      
      const dbRule = await this.databaseService.getAccessRule(type, slug)
      console.log(`🔍 DatabaseService result:`, dbRule)
      
      if (dbRule) {
        const result = {
          isProtected: dbRule.access_mode !== 'open',
          accessMode: dbRule.access_mode
        }
        console.log(`🔍 Access mode result:`, result)
        return result
      }
    } else {
      console.log(`🔍 No databaseService available`)
    }
    
    // Default to open if not in database
    console.log(`🔍 No database rule found, defaulting to open`)
    return { isProtected: false, accessMode: 'open' }
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
