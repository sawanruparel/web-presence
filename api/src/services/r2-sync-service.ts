import type { Env } from '../types/env'
import type { ProcessedContent } from './content-processing-service'

/** R2 object key for a content item. Must match keys used in content-metadata.json (type = top-level key). */
export function contentObjectKey(type: string, slug: string): string {
  return `${type}/${slug}.html`
}

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
  uploadDetails?: Array<{ bucket: 'protected' | 'public'; key: string; size: number }>
  deleteDetails?: Array<{ bucket: 'protected' | 'public'; key: string }>
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
  async uploadProtectedContent(content: ProcessedContent, htmlTemplate: string): Promise<boolean> {
    try {
      const key = contentObjectKey(content.type, content.slug)
      
      await this.protectedBucket.put(key, htmlTemplate, {
        httpMetadata: {
          contentType: 'text/html'
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
      const key = contentObjectKey(content.type, content.slug)
      
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
   * Sync all content to R2 with cleanup
   */
  async syncAllContent(
    processedContent: ProcessedContent[],
    contentMetadata: Record<string, any>,
    htmlTemplate: (content: ProcessedContent) => string,
    options: { cleanupStale?: boolean } = {}
  ): Promise<SyncReport> {
    const report: SyncReport = {
      uploaded: [],
      deleted: [],
      errors: [],
      totalProcessed: processedContent.length,
      success: true,
      uploadDetails: [],
      deleteDetails: []
    }

    try {
      console.log(`🔄 Starting R2 sync for ${processedContent.length} content items`)

      // Ensure contentMetadata keys match what we upload: each public item must exist under metadata[content.type]
      const publicContent = processedContent.filter(c => !c.isProtected)
      for (const content of publicContent) {
        const arr = contentMetadata[content.type]
        const inMetadata = Array.isArray(arr) && arr.some((item: { slug?: string }) => item.slug === content.slug)
        if (!inMetadata) {
          console.warn(`⚠️ Public content ${content.type}/${content.slug} has no entry in contentMetadata.${content.type} – metadata may be out of sync with uploaded HTML`)
        }
      }

      // Upload all content (keys must match content-metadata.json: type/slug.html, type = metadata top-level key)
      for (const content of processedContent) {
        const htmlTemplateContent = htmlTemplate(content)
        const key = contentObjectKey(content.type, content.slug)
        
        if (content.isProtected) {
          const success = await this.uploadProtectedContent(content, htmlTemplateContent)
          if (success) {
            report.uploaded.push(`protected:${key}`)
            report.uploadDetails!.push({
              bucket: 'protected',
              key,
              size: new Blob([htmlTemplateContent]).size
            })
          } else {
            report.errors.push(`Failed to upload protected content: ${content.slug}`)
            report.success = false
          }
        } else {
          const success = await this.uploadPublicContent(content, htmlTemplateContent)
          if (success) {
            report.uploaded.push(`public:${key}`)
            report.uploadDetails!.push({
              bucket: 'public',
              key,
              size: new Blob([htmlTemplateContent]).size
            })
          } else {
            report.errors.push(`Failed to upload public content: ${content.slug}`)
            report.success = false
          }
        }
      }

      // Upload metadata
      const metadataContent = JSON.stringify(contentMetadata, null, 2)
      const metadataSuccess = await this.uploadContentMetadata(contentMetadata)
      if (metadataSuccess) {
        report.uploaded.push('public:content-metadata.json')
        report.uploadDetails!.push({
          bucket: 'public',
          key: 'content-metadata.json',
          size: new Blob([metadataContent]).size
        })
      } else {
        report.errors.push('Failed to upload content metadata')
        report.success = false
      }

      if (options.cleanupStale !== false) {
        // Cleanup stale objects
        const protectedDeleted = await this.cleanupStaleObjects(
          processedContent.filter(c => c.isProtected),
          'protected'
        )
        report.deleted.push(...protectedDeleted.map(key => `protected:${key}`))
        report.deleteDetails!.push(...protectedDeleted.map(key => ({
          bucket: 'protected' as const,
          key
        })))

        const publicDeleted = await this.cleanupStaleObjects(
          processedContent.filter(c => !c.isProtected),
          'public'
        )
        report.deleted.push(...publicDeleted.map(key => `public:${key}`))
        report.deleteDetails!.push(...publicDeleted.map(key => ({
          bucket: 'public' as const,
          key
        })))
      }

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
      const key = contentObjectKey(type, slug)
      return await this.getObject('public', key)
    } catch (error) {
      console.error(`❌ Failed to get public HTML ${type}/${slug}:`, error)
      return null
    }
  }

  /**
   * Clean up stale objects that are no longer in the current content set
   */
  async cleanupStaleObjects(
    currentContent: ProcessedContent[],
    bucket: 'protected' | 'public'
  ): Promise<string[]> {
    try {
      const r2Bucket = bucket === 'protected' ? this.protectedBucket : this.publicBucket
      
      // Get all objects in the bucket
      const allObjects = await r2Bucket.list()
      const currentKeys = new Set(
        currentContent.map(content => contentObjectKey(content.type, content.slug))
      )
      
      // Find objects that are not in the current content set
      const staleObjects = allObjects.objects.filter(obj => 
        !currentKeys.has(obj.key) && 
        obj.key !== 'content-metadata.json' // Don't delete metadata
      )
      
      // Delete stale objects
      const deletedKeys: string[] = []
      for (const obj of staleObjects) {
        try {
          await r2Bucket.delete(obj.key)
          deletedKeys.push(obj.key)
          console.log(`✅ Deleted ${bucket} object: ${obj.key}`)
        } catch (error) {
          console.error(`❌ Failed to delete ${bucket} object ${obj.key}:`, error)
        }
      }
      
      console.log(`🧹 Cleaned up ${deletedKeys.length} stale objects from ${bucket} bucket`)
      return deletedKeys
    } catch (error) {
      console.error(`❌ Failed to cleanup stale objects in ${bucket} bucket:`, error)
      return []
    }
  }
}
