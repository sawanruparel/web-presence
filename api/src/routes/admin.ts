/**
 * Admin Routes
 * 
 * Provides admin-only endpoints for content management and overview.
 * Protected by admin authentication middleware.
 */

import { Hono } from 'hono'
import type { Env } from '../types/env'
import { adminAuthMiddleware } from '../middleware/admin-auth'
import { GitHubService } from '../services/github-service'
import { createDatabaseService } from '../services/database-service'
import { hashPassword } from '../utils/password'
import { R2SyncService } from '../services/r2-sync-service'
import { ContentProcessingService } from '../services/content-processing-service'

const app = new Hono<{ Bindings: Env }>()

/**
 * POST /api/admin/auth
 * 
 * Authenticate admin user with password.
 * Returns session token on success.
 */
app.post('/auth', async (c) => {
  try {
    const body = await c.req.json() as { password: string }
    
    if (!body.password) {
      return c.json({ 
        success: false, 
        message: 'Password is required' 
      }, 400)
    }

    const adminPassword = c.env.ADMIN_PASSWORD
    
    if (!adminPassword) {
      console.error('ADMIN_PASSWORD environment variable is not set')
      return c.json({ 
        success: false, 
        message: 'Admin authentication is not configured' 
      }, 500)
    }

    // Verify password (compare directly or hash and compare)
    // For simplicity, we'll compare directly (in production, use hashed comparison)
    const isValid = body.password === adminPassword
    
    // Alternative: If password is stored as hash in env, use:
    // const isValid = await verifyPassword(body.password, adminPassword)
    
    if (!isValid) {
      return c.json({ 
        success: false, 
        message: 'Invalid password' 
      }, 401)
    }

    // Generate admin token (24 hour expiration)
    const tokenData = {
      type: 'admin',
      timestamp: Date.now(),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }
    
    const token = btoa(JSON.stringify(tokenData))

    return c.json({
      success: true,
      token
    })
  } catch (error) {
    console.error('Error authenticating admin:', error)
    return c.json({ 
      success: false, 
      message: 'Internal server error' 
    }, 500)
  }
})

/**
 * GET /api/admin/content-overview
 * 
 * Get comprehensive overview of all content from GitHub and database.
 * Shows alignment between GitHub files and database access rules.
 * 
 * Protected by admin authentication middleware.
 */
app.get('/content-overview', adminAuthMiddleware, async (c) => {
  try {
    const env = c.env
    const githubService = new GitHubService(env)
    const dbService = createDatabaseService(env.DB)
    
    const contentTypes = ['notes', 'ideas', 'publications', 'pages']
    
    // Fetch all content files from GitHub
    const githubContentMap = new Map<string, {
      type: string
      slug: string
      path: string
      sha: string
      size: number
    }>()
    
    for (const type of contentTypes) {
      try {
        const files = await githubService.getDirectory(`content/${type}`)
        for (const file of files) {
          if (file.name.endsWith('.md')) {
            const slug = file.name.replace(/\.md$/, '')
            const key = `${type}/${slug}`
            githubContentMap.set(key, {
              type,
              slug,
              path: file.path,
              sha: file.sha,
              size: file.size
            })
          }
        }
      } catch (error) {
        console.error(`Error fetching GitHub files for ${type}:`, error)
        // Continue with other types even if one fails
      }
    }
    
    // Fetch all access rules from database
    const dbRules = await dbService.getAllAccessRulesWithEmails()
    const dbRulesMap = new Map<string, {
      type: string
      slug: string
      accessMode: string
      description: string | null
      allowedEmails: string[]
      updatedAt: string
    }>()
    
    for (const { rule, emails } of dbRules) {
      const key = `${rule.type}/${rule.slug}`
      dbRulesMap.set(key, {
        type: rule.type,
        slug: rule.slug,
        accessMode: rule.access_mode,
        description: rule.description,
        allowedEmails: emails,
        updatedAt: rule.updated_at
      })
    }

    // Get last successful build timestamp
    const lastBuildTimestamp = await dbService.getLastSuccessfulBuildTimestamp()
    
    // Helper function to normalize content type to plural form for R2 bucket lookup
    // R2 buckets always use plural forms: ideas, notes, pages, publications
    const normalizeTypeForR2 = (type: string): string => {
      const typeMap: Record<string, string> = {
        'idea': 'ideas',
        'note': 'notes',
        'page': 'pages',
        'publication': 'publications',
        // Already plural - keep as is
        'ideas': 'ideas',
        'notes': 'notes',
        'pages': 'pages',
        'publications': 'publications'
      }
      return typeMap[type.toLowerCase()] || type
    }
    
    // Fetch R2 bucket contents to check if content exists
    const r2Service = new R2SyncService(env)
    const protectedObjects = await r2Service.listObjects('protected')
    const publicObjects = await r2Service.listObjects('public')
    
    // Create maps for quick lookup: type/slug -> R2 object info
    const protectedMap = new Map<string, { size: number; uploaded: Date }>()
    const publicMap = new Map<string, { size: number; uploaded: Date }>()
    
    for (const obj of protectedObjects) {
      if (obj.key.endsWith('.html')) {
        const key = obj.key.replace('.html', '') // Remove .html extension
        protectedMap.set(key, { size: obj.size, uploaded: obj.uploaded })
      }
    }
    
    for (const obj of publicObjects) {
      if (obj.key.endsWith('.html')) {
        const key = obj.key.replace('.html', '') // Remove .html extension
        publicMap.set(key, { size: obj.size, uploaded: obj.uploaded })
      }
    }
    
    // Combine and align data
    const allKeys = new Set([...githubContentMap.keys(), ...dbRulesMap.keys()])
    const content: Array<{
      type: string
      slug: string
      github: {
        exists: boolean
        path?: string
        sha?: string
        size?: number
      }
      database: {
        exists: boolean
        accessMode?: string
        description?: string | null
        allowedEmails?: string[]
        updatedAt?: string
        needsRebuild?: boolean
      }
      r2: {
        exists: boolean
        bucket?: 'protected' | 'public'
        size?: number
        uploaded?: string
      }
      status: 'aligned' | 'github-only' | 'database-only'
    }> = []
    
    for (const key of allKeys) {
      const [type, slug] = key.split('/')
      const githubData = githubContentMap.get(key)
      const dbData = dbRulesMap.get(key)
      
      // Check R2 buckets - R2 keys always use plural forms (ideas, notes, pages, publications)
      // Normalize type to plural form to handle any singular forms from database
      const normalizedType = normalizeTypeForR2(type)
      const r2Key = `${normalizedType}/${slug}`
      const protectedR2 = protectedMap.get(r2Key)
      const publicR2 = publicMap.get(r2Key)
      
      let r2Status: {
        exists: boolean
        bucket?: 'protected' | 'public'
        size?: number
        uploaded?: string
      } = {
        exists: false
      }
      
      if (protectedR2) {
        r2Status = {
          exists: true,
          bucket: 'protected',
          size: protectedR2.size,
          uploaded: protectedR2.uploaded.toISOString()
        }
      } else if (publicR2) {
        r2Status = {
          exists: true,
          bucket: 'public',
          size: publicR2.size,
          uploaded: publicR2.uploaded.toISOString()
        }
      }
      
      let status: 'aligned' | 'github-only' | 'database-only'
      if (githubData && dbData) {
        status = 'aligned'
      } else if (githubData && !dbData) {
        status = 'github-only'
      } else {
        status = 'database-only'
      }
      
      // Calculate if rebuild is needed
      let needsRebuild = false
      if (dbData && lastBuildTimestamp && dbData.updatedAt) {
        const updatedAt = new Date(dbData.updatedAt)
        const lastBuild = new Date(lastBuildTimestamp)
        needsRebuild = updatedAt > lastBuild
      }

      content.push({
        type,
        slug,
        github: {
          exists: !!githubData,
          path: githubData?.path,
          sha: githubData?.sha,
          size: githubData?.size
        },
        database: {
          exists: !!dbData,
          accessMode: dbData?.accessMode,
          description: dbData?.description,
          allowedEmails: dbData?.allowedEmails,
          updatedAt: dbData?.updatedAt,
          needsRebuild
        },
        r2: r2Status,
        status
      })
    }
    
    // Sort by type, then slug
    content.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type)
      }
      return a.slug.localeCompare(b.slug)
    })
    
    // Calculate summary
    const summary = {
      total: content.length,
      aligned: content.filter(c => c.status === 'aligned').length,
      githubOnly: content.filter(c => c.status === 'github-only').length,
      databaseOnly: content.filter(c => c.status === 'database-only').length
    }
    
    return c.json({
      content,
      summary,
      lastBuildTimestamp,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching content overview:', error)
    return c.json({ 
      error: 'Internal Server Error',
      message: 'Failed to fetch content overview',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * POST /api/admin/access-rules
 * 
 * Create a new access rule in the database.
 * Protected by admin authentication middleware.
 */
app.post('/access-rules', adminAuthMiddleware, async (c) => {
  try {
    const env = c.env
    const body = await c.req.json() as {
      type: string
      slug: string
      accessMode: 'open' | 'password' | 'email-list'
      description?: string
      password?: string
      allowedEmails?: string[]
    }
    const dbService = createDatabaseService(env.DB)

    // Validate required fields
    if (!body.type || !body.slug || !body.accessMode) {
      return c.json({ 
        error: 'Bad Request',
        message: 'Missing required fields: type, slug, accessMode' 
      }, 400)
    }

    // Check if rule already exists
    const existingRule = await env.DB.prepare(
      'SELECT id FROM content_access_rules WHERE type = ? AND slug = ?'
    ).bind(body.type, body.slug).first() as { id: number } | null

    if (existingRule) {
      return c.json({ 
        error: 'Conflict',
        message: `Access rule already exists for ${body.type}/${body.slug}` 
      }, 409)
    }

    // Hash password if provided
    let passwordHash: string | null = null
    if (body.accessMode === 'password') {
      if (!body.password) {
        return c.json({ 
          error: 'Bad Request',
          message: 'Password is required for password mode' 
        }, 400)
      }
      passwordHash = await hashPassword(body.password)
    }

    // Create access rule
    const result = await env.DB.prepare(
      `INSERT INTO content_access_rules 
       (type, slug, access_mode, description, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    ).bind(
      body.type,
      body.slug,
      body.accessMode,
      body.description || null,
      passwordHash
    ).run()

    const ruleId = result.meta.last_row_id

    // Add email allowlist if provided
    if (body.allowedEmails && body.allowedEmails.length > 0) {
      for (const email of body.allowedEmails) {
        await env.DB.prepare(
          'INSERT INTO email_allowlist (access_rule_id, email) VALUES (?, ?)'
        ).bind(ruleId, email.toLowerCase().trim()).run()
      }
    }

    // Get created rule with emails
    const { rule, emails } = await dbService.getAccessRuleWithEmails(body.type, body.slug)

    return c.json({
      message: 'Access rule created successfully',
      rule: {
        ...rule,
        allowedEmails: rule?.access_mode === 'email-list' ? emails : undefined
      }
    }, 201)
  } catch (error) {
    console.error('Error creating access rule:', error)
    return c.json({ 
      error: 'Internal Server Error',
      message: 'Failed to create access rule',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * DELETE /api/admin/access-rules/:type/:slug
 * 
 * Delete an access rule from the database.
 * Protected by admin authentication middleware.
 */
app.delete('/access-rules/:type/:slug', adminAuthMiddleware, async (c) => {
  try {
    const env = c.env
    const type = c.req.param('type')
    const slug = c.req.param('slug')

    // Delete access rule (cascade will delete email allowlist)
    const result = await env.DB.prepare(
      'DELETE FROM content_access_rules WHERE type = ? AND slug = ?'
    ).bind(type, slug).run()

    if (result.meta.changes === 0) {
      return c.json({ error: 'Access rule not found' }, 404)
    }

    return c.json({
      message: 'Access rule deleted successfully',
      type,
      slug
    }, 200)
  } catch (error) {
    console.error('Error deleting access rule:', error)
    return c.json({ 
      error: 'Internal Server Error',
      message: 'Failed to delete access rule',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * PUT /api/admin/access-rules/:type/:slug
 * 
 * Update an access rule in the database.
 * Protected by admin authentication middleware.
 */
app.put('/access-rules/:type/:slug', adminAuthMiddleware, async (c) => {
  try {
    const env = c.env
    const type = c.req.param('type')
    const slug = c.req.param('slug')
    const body = await c.req.json() as {
      accessMode?: 'open' | 'password' | 'email-list'
      description?: string
      password?: string
      allowedEmails?: string[]
    }
    const dbService = createDatabaseService(env.DB)

    // Get existing rule
    const existingRule = await env.DB.prepare(
      'SELECT id FROM content_access_rules WHERE type = ? AND slug = ?'
    ).bind(type, slug).first() as { id: number } | null

    if (!existingRule) {
      return c.json({ error: 'Access rule not found' }, 404)
    }

    const ruleId = existingRule.id

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []

    if (body.accessMode !== undefined) {
      updates.push('access_mode = ?')
      values.push(body.accessMode)
    }

    if (body.description !== undefined) {
      updates.push('description = ?')
      values.push(body.description)
    }

    if (body.password !== undefined) {
      const passwordHash = await hashPassword(body.password)
      updates.push('password_hash = ?')
      values.push(passwordHash)
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(ruleId)

      const updateQuery = `UPDATE content_access_rules SET ${updates.join(', ')} WHERE id = ?`
      await env.DB.prepare(updateQuery).bind(...values).run()
    }

    // Update email allowlist if provided
    if (body.allowedEmails !== undefined) {
      // Clear existing allowlist
      await env.DB.prepare('DELETE FROM email_allowlist WHERE access_rule_id = ?')
        .bind(ruleId)
        .run()

      // Insert new allowlist entries
      for (const email of body.allowedEmails) {
        await env.DB.prepare(
          'INSERT INTO email_allowlist (access_rule_id, email) VALUES (?, ?)'
        ).bind(ruleId, email.toLowerCase().trim()).run()
      }
    }

    // Get updated rule with emails
    const { rule, emails } = await dbService.getAccessRuleWithEmails(type, slug)

    return c.json({
      message: 'Access rule updated successfully',
      rule: {
        ...rule,
        allowedEmails: rule?.access_mode === 'email-list' ? emails : undefined
      }
    }, 200)
  } catch (error) {
    console.error('Error updating access rule:', error)
    return c.json({ 
      error: 'Internal Server Error',
      message: 'Failed to update access rule',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * POST /api/admin/content-sync
 * 
 * Trigger a full content sync from GitHub to R2 buckets.
 * Protected by admin authentication middleware.
 */
app.post('/content-sync', adminAuthMiddleware, async (c) => {
  try {
    const env = c.env
    const githubService = new GitHubService(env)
    const contentProcessor = new ContentProcessingService(env.FRONTEND_URL || 'https://sawanruparel.com', env)
    const r2Service = new R2SyncService(env)
    
    // Get all content files from GitHub
    const allFiles = await githubService.getAllContentFiles()
    const filesToProcess = allFiles.map(file => file.path)
    
    console.log(`🔄 Admin content sync: processing ${filesToProcess.length} files`)
    
    const processedContent: any[] = []
    const errors: string[] = []
    const logs: string[] = []
    
    logs.push(`Starting sync of ${filesToProcess.length} files...`)
    
    // Process each file
    for (const filePath of filesToProcess) {
      try {
        logs.push(`Processing: ${filePath}`)
        
        // Get file content from GitHub
        const content = await githubService.getFileContent(filePath)
        if (!content) {
          logs.push(`⚠️ File not found or empty: ${filePath}`)
          continue
        }
        
        // Process the content
        const processed = await contentProcessor.processContentFile(filePath, content)
        processedContent.push(processed)
        
        logs.push(`✅ Processed: ${processed.slug} (${processed.isProtected ? 'protected' : 'public'})`)
        
      } catch (error) {
        const errorMsg = `Failed to process ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
        logs.push(`❌ ${errorMsg}`)
        errors.push(errorMsg)
      }
    }
    
    if (processedContent.length === 0) {
      return c.json({
        success: false,
        message: 'No content processed',
        errors,
        logs
      }, 400)
    }
    
    logs.push(`Generating metadata for ${processedContent.length} content items...`)
    
    // Generate metadata
    const contentMetadata = contentProcessor.generateContentMetadata(processedContent)
    const protectedMetadata = contentProcessor.generateProtectedContentMetadata(processedContent)
    
    logs.push(`Syncing to R2 buckets...`)
    
    // Sync to R2
    const syncReport = await r2Service.syncAllContent(
      processedContent,
      contentMetadata,
      (content) => contentProcessor.generatePublicHtmlTemplate(content)
    )
    
    logs.push(`✅ Sync completed: ${syncReport.uploaded.length} uploaded, ${syncReport.deleted.length} deleted`)
    
    if (syncReport.errors.length > 0) {
      logs.push(`⚠️ Errors: ${syncReport.errors.join(', ')}`)
    }
    
    return c.json({
      success: syncReport.success,
      message: 'Content sync completed',
      processed: processedContent.length,
      uploaded: syncReport.uploaded.length,
      deleted: syncReport.deleted.length,
      errors: [...errors, ...syncReport.errors],
      logs,
      metadata: {
        public: Object.keys(contentMetadata).reduce((sum, key) => sum + contentMetadata[key].length, 0),
        protected: Object.keys(protectedMetadata).reduce((sum, key) => sum + protectedMetadata[key].length, 0)
      },
      uploadDetails: syncReport.uploadDetails || [],
      deleteDetails: syncReport.deleteDetails || []
    }, 200)
  } catch (error) {
    console.error('Error in admin content sync:', error)
    return c.json({ 
      error: 'Internal Server Error',
      message: 'Failed to sync content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export { app as adminRouter }
