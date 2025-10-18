import type { Env } from '../types/env'
import type { ProcessedContent } from './content-processing-service'

export interface R2Object {
  key: string
  size: number
  etag: string
  uploaded: Date
}

export interface SyncReport {
  uploaded: string[]
  deleted: string[]
  errors: string[]
  totalProcessed: number
  success: boolean
}

export class R2SyncService {
  private protectedBucket: R2Bucket
  private publicBucket: R2Bucket

  constructor(env: Env) {
    this.protectedBucket = env.PROTECTED_CONTENT_BUCKET
    this.publicBucket = env.PUBLIC_CONTENT_BUCKET
  }

  /**
   * Upload protected content to R2
   */
  async uploadProtectedContent(content: ProcessedContent): Promise<boolean> {
    try {
      const key = `${content.type}/${content.slug}.json`
      const contentData = {
        slug: content.slug,
        title: content.title,
        date: content.date,
        readTime: content.readTime,
        type: content.type,
        content: content.content,
        html: content.html,
        excerpt: content.excerpt,
        isProtected: content.isProtected,
        accessMode: content.accessMode,
        requiresPassword: content.requiresPassword,
        requiresEmail: content.requiresEmail
      }

      await this.protectedBucket.put(key, JSON.stringify(contentData, null, 2), {
        httpMetadata: {
          contentType: 'application/json'
        }
      })

      console.log(`✅ Uploaded protected content: ${key}`)
      return true
    } catch (error) {
      console.error(`❌ Failed to upload protected content ${content.slug}:`, error)
      return false
    }
  }

  /**
   * Upload public content HTML to R2
   */
  async uploadPublicContent(content: ProcessedContent, htmlTemplate: string): Promise<boolean> {
    try {
      const key = `${content.type}/${content.slug}.html`
      
      await this.publicBucket.put(key, htmlTemplate, {
        httpMetadata: {
          contentType: 'text/html'
        }
      })

      console.log(`✅ Uploaded public content: ${key}`)
      return true
    } catch (error) {
      console.error(`❌ Failed to upload public content ${content.slug}:`, error)
      return false
    }
  }

  /**
   * Upload content metadata to R2
   */
  async uploadContentMetadata(metadata: Record<string, any>): Promise<boolean> {
    try {
      const key = 'content-metadata.json'
      
      await this.publicBucket.put(key, JSON.stringify(metadata, null, 2), {
        httpMetadata: {
          contentType: 'application/json'
        }
      })

      console.log(`✅ Uploaded content metadata: ${key}`)
      return true
    } catch (error) {
      console.error(`❌ Failed to upload content metadata:`, error)
      return false
    }
  }

  /**
   * List all objects in a bucket
   */
  async listObjects(bucket: 'protected' | 'public', prefix?: string): Promise<R2Object[]> {
    try {
      const r2Bucket = bucket === 'protected' ? this.protectedBucket : this.publicBucket
      const listResult = await r2Bucket.list({ prefix })
      
      return listResult.objects.map(obj => ({
        key: obj.key,
        size: obj.size,
        etag: obj.etag,
        uploaded: obj.uploaded
      }))
    } catch (error) {
      console.error(`❌ Failed to list objects in ${bucket} bucket:`, error)
      return []
    }
  }

  /**
   * Delete object from R2
   */
  async deleteObject(bucket: 'protected' | 'public', key: string): Promise<boolean> {
    try {
      const r2Bucket = bucket === 'protected' ? this.protectedBucket : this.publicBucket
      await r2Bucket.delete(key)
      console.log(`✅ Deleted ${bucket} object: ${key}`)
      return true
    } catch (error) {
      console.error(`❌ Failed to delete ${bucket} object ${key}:`, error)
      return false
    }
  }

  /**
   * Get object from R2
   */
  async getObject(bucket: 'protected' | 'public', key: string): Promise<string | null> {
    try {
      const r2Bucket = bucket === 'protected' ? this.protectedBucket : this.publicBucket
      const object = await r2Bucket.get(key)
      
      if (!object) {
        return null
      }

      return await object.text()
    } catch (error) {
      console.error(`❌ Failed to get ${bucket} object ${key}:`, error)
      return null
    }
  }

  /**
   * Clean up stale objects from R2
   */
  async cleanupStaleObjects(
    currentContent: ProcessedContent[],
    bucket: 'protected' | 'public'
  ): Promise<string[]> {
    const deletedKeys: string[] = []
    
    try {
      // Get current objects in bucket
      const existingObjects = await this.listObjects(bucket)
      
      // Create set of current content keys
      const currentKeys = new Set(
        currentContent.map(content => 
          bucket === 'protected' 
            ? `${content.type}/${content.slug}.json`
            : `${content.type}/${content.slug}.html`
        )
      )

      // Add metadata key for public bucket
      if (bucket === 'public') {
        currentKeys.add('content-metadata.json')
      }

      // Find and delete stale objects
      for (const obj of existingObjects) {
        if (!currentKeys.has(obj.key)) {
          const success = await this.deleteObject(bucket, obj.key)
          if (success) {
            deletedKeys.push(obj.key)
          }
        }
      }

      console.log(`🧹 Cleaned up ${deletedKeys.length} stale objects from ${bucket} bucket`)
      return deletedKeys
    } catch (error) {
      console.error(`❌ Failed to cleanup stale objects from ${bucket} bucket:`, error)
      return deletedKeys
    }
  }

  /**
   * Sync all content to R2 with cleanup
   */
  async syncAllContent(
    processedContent: ProcessedContent[],
    contentMetadata: Record<string, any>,
    htmlTemplate: (content: ProcessedContent) => string
  ): Promise<SyncReport> {
    const report: SyncReport = {
      uploaded: [],
      deleted: [],
      errors: [],
      totalProcessed: processedContent.length,
      success: true
    }

    try {
      console.log(`🔄 Starting R2 sync for ${processedContent.length} content items`)

      // Upload all content
      for (const content of processedContent) {
        if (content.isProtected) {
          const success = await this.uploadProtectedContent(content)
          if (success) {
            report.uploaded.push(`protected:${content.type}/${content.slug}.json`)
          } else {
            report.errors.push(`Failed to upload protected content: ${content.slug}`)
            report.success = false
          }
        } else {
          const htmlTemplateContent = htmlTemplate(content)
          const success = await this.uploadPublicContent(content, htmlTemplateContent)
          if (success) {
            report.uploaded.push(`public:${content.type}/${content.slug}.html`)
          } else {
            report.errors.push(`Failed to upload public content: ${content.slug}`)
            report.success = false
          }
        }
      }

      // Upload metadata
      const metadataSuccess = await this.uploadContentMetadata(contentMetadata)
      if (metadataSuccess) {
        report.uploaded.push('public:content-metadata.json')
      } else {
        report.errors.push('Failed to upload content metadata')
        report.success = false
      }

      // Cleanup stale objects
      const protectedDeleted = await this.cleanupStaleObjects(
        processedContent.filter(c => c.isProtected),
        'protected'
      )
      report.deleted.push(...protectedDeleted.map(key => `protected:${key}`))

      const publicDeleted = await this.cleanupStaleObjects(
        processedContent.filter(c => !c.isProtected),
        'public'
      )
      report.deleted.push(...publicDeleted.map(key => `public:${key}`))

      console.log(`✅ R2 sync completed: ${report.uploaded.length} uploaded, ${report.deleted.length} deleted, ${report.errors.length} errors`)
      
      return report
    } catch (error) {
      console.error('❌ R2 sync failed:', error)
      report.errors.push(`Sync failed: ${error}`)
      report.success = false
      return report
    }
  }

  /**
   * Get all public content for frontend build
   */
  async getAllPublicContent(): Promise<Record<string, any> | null> {
    try {
      const metadata = await this.getObject('public', 'content-metadata.json')
      if (!metadata) {
        console.warn('⚠️ No content metadata found in R2')
        return null
      }

      return JSON.parse(metadata)
    } catch (error) {
      console.error('❌ Failed to get public content from R2:', error)
      return null
    }
  }

  /**
   * Get specific public HTML file
   */
  async getPublicHtml(type: string, slug: string): Promise<string | null> {
    try {
      const key = `${type}/${slug}.html`
      return await this.getObject('public', key)
    } catch (error) {
      console.error(`❌ Failed to get public HTML ${type}/${slug}:`, error)
      return null
    }
  }
}
