import { Hono } from 'hono'
import type { Context } from 'hono'
import type { Env } from '../types/env'
import { GitHubService } from '../services/github-service'
import { ContentProcessingService } from '../services/content-processing-service'
import { R2SyncService } from '../services/r2-sync-service'

const contentSyncRouter = new Hono<{ Bindings: Env }>()

/**
 * Handle GitHub webhook for content changes
 */
contentSyncRouter.post('/webhook', async (c: Context) => {
  try {
    const env = c.env
    const signature = c.req.header('X-Hub-Signature-256')
    const payload = await c.req.text()

    if (!signature) {
      return c.json({ error: 'Missing webhook signature' }, 400)
    }

    // Validate webhook signature
    const githubService = new GitHubService(env)
    const isValid = await githubService.validateWebhookSignature(
      payload,
      signature,
      env.GITHUB_WEBHOOK_SECRET
    )

    if (!isValid) {
      return c.json({ error: 'Invalid webhook signature' }, 401)
    }

    // Parse webhook payload
    const webhookData = JSON.parse(payload) as any

    // Only process push events to main branch
    if (webhookData.ref !== `refs/heads/${env.GITHUB_BRANCH || 'main'}`) {
      return c.json({ message: 'Not main branch, skipping' }, 200)
    }

    // Get changed files
    const changedFiles = githubService.getChangedFiles(webhookData)
    
    if (changedFiles.length === 0) {
      return c.json({ message: 'No content files changed' }, 200)
    }

    console.log(`🔄 Processing ${changedFiles.length} changed files`)

    // Process the changes
    const result = await processContentChanges(env, changedFiles)

    return c.json({
      message: 'Content sync completed',
      filesProcessed: changedFiles.length,
      result
    }, 200)

  } catch (error) {
    console.error('❌ Webhook processing failed:', error)
    return c.json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * Manual sync endpoint for testing or full sync
 */
contentSyncRouter.post('/manual', async (c: Context) => {
  try {
    const env = c.env
    const body = await c.req.json()
    const { full_sync = false, files = [] } = body

    // Validate API key
    const apiKey = c.req.header('X-API-Key')
    if (apiKey !== env.INTERNAL_API_KEY) {
      return c.json({ error: 'Invalid API key' }, 401)
    }

    let filesToProcess: string[] = []

    if (full_sync) {
      // Get all content files
      const githubService = new GitHubService(env)
      const allFiles = await githubService.getAllContentFiles()
      filesToProcess = allFiles.map(file => file.path)
    } else if (files.length > 0) {
      filesToProcess = files
    } else {
      return c.json({ error: 'No files specified for sync' }, 400)
    }

    console.log(`🔄 Manual sync: processing ${filesToProcess.length} files`)

    // Process the files
    const result = await processContentChanges(env, filesToProcess)

    return c.json({
      message: 'Manual sync completed',
      filesProcessed: filesToProcess.length,
      result
    }, 200)

  } catch (error) {
    console.error('❌ Manual sync failed:', error)
    return c.json({ 
      error: 'Manual sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * Get sync status and statistics
 */
contentSyncRouter.get('/status', async (c: Context) => {
  try {
    const env = c.env

    // Validate API key
    const apiKey = c.req.header('X-API-Key')
    if (apiKey !== env.INTERNAL_API_KEY) {
      return c.json({ error: 'Invalid API key' }, 401)
    }

    const r2Service = new R2SyncService(env)
    
    // Get object counts
    const protectedObjects = await r2Service.listObjects('protected')
    const publicObjects = await r2Service.listObjects('public')

    return c.json({
      status: 'healthy',
      buckets: {
        protected: {
          count: protectedObjects.length,
          objects: protectedObjects.map(obj => ({
            key: obj.key,
            size: obj.size,
            uploaded: obj.uploaded
          }))
        },
        public: {
          count: publicObjects.length,
          objects: publicObjects.map(obj => ({
            key: obj.key,
            size: obj.size,
            uploaded: obj.uploaded
          }))
        }
      }
    }, 200)

  } catch (error) {
    console.error('❌ Status check failed:', error)
    return c.json({ 
      error: 'Status check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * Process content changes (shared logic for webhook and manual sync)
 */
async function processContentChanges(env: Env, filePaths: string[]) {
  const githubService = new GitHubService(env)
  const contentProcessor = new ContentProcessingService(env.FRONTEND_URL || 'https://sawanruparel.com', env)
  const r2Service = new R2SyncService(env)

  const processedContent: any[] = []
  const errors: string[] = []

  // Process each file
  for (const filePath of filePaths) {
    try {
      console.log(`📄 Processing: ${filePath}`)

      // Get file content from GitHub
      const content = await githubService.getFileContent(filePath)
      if (!content) {
        console.warn(`⚠️ File not found or empty: ${filePath}`)
        continue
      }

      // Process the content
      const processed = await contentProcessor.processContentFile(filePath, content)
      processedContent.push(processed)

      console.log(`✅ Processed: ${processed.slug} (${processed.isProtected ? 'protected' : 'public'})`)

    } catch (error) {
      const errorMsg = `Failed to process ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(`❌ ${errorMsg}`)
      errors.push(errorMsg)
    }
  }

  if (processedContent.length === 0) {
    return {
      success: false,
      message: 'No content processed',
      errors
    }
  }

  // Generate metadata
  const contentMetadata = contentProcessor.generateContentMetadata(processedContent)
  const protectedMetadata = contentProcessor.generateProtectedContentMetadata(processedContent)

  // Sync to R2
  const syncReport = await r2Service.syncAllContent(
    processedContent,
    contentMetadata,
    (content) => contentProcessor.generatePublicHtmlTemplate(content)
  )

  return {
    success: syncReport.success,
    processed: processedContent.length,
    uploaded: syncReport.uploaded.length,
    deleted: syncReport.deleted.length,
    errors: [...errors, ...syncReport.errors],
    metadata: {
      public: Object.keys(contentMetadata).length,
      protected: Object.keys(protectedMetadata).length
    }
  }
}

export { contentSyncRouter }
