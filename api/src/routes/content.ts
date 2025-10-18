/**
 * Content Routes
 * 
 * Provides content endpoints for the UI to fetch public and protected content.
 * These endpoints serve actual content from R2 buckets.
 */

import { Hono } from 'hono'
import type { Env } from '../types/env'
import { R2SyncService } from '../services/r2-sync-service'
import { contentService } from '../services/content-service'
import { createDatabaseService } from '../services/database-service'

const app = new Hono<{ Bindings: Env }>()

/**
 * GET /api/content/catalog
 * 
 * Returns all content metadata (both public and protected) for the UI.
 * This combines database rules with R2 content metadata.
 */
app.get('/catalog', async (c) => {
  try {
    const env = c.env
    const dbService = createDatabaseService(env.DB)
    const r2Service = new R2SyncService(env)
    
    // Get all access rules from database
    const rulesWithEmails = await dbService.getAllAccessRulesWithEmails()
    
    // Get content metadata from R2
    const contentMetadata = await r2Service.getAllPublicContent()
    
    // Transform database rules to UI format
    const rules = rulesWithEmails.map(({ rule, emails }) => ({
      type: rule.type,
      slug: rule.slug,
      accessMode: rule.access_mode,
      description: rule.description || undefined,
      requiresPassword: rule.access_mode === 'password',
      requiresEmail: rule.access_mode === 'email-list',
      allowedEmails: rule.access_mode === 'email-list' ? emails : undefined
    }))
    
    return c.json({
      content: rules,
      metadata: contentMetadata,
      totalCount: rules.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching content catalog:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Failed to fetch content catalog'
    }, 500)
  }
})

/**
 * GET /api/content/public
 * 
 * Returns all public content from R2 buckets.
 * This serves the actual HTML content for public pages.
 */
app.get('/public', async (c) => {
  try {
    const env = c.env
    const r2Service = new R2SyncService(env)
    
    // Get all public content from R2
    const publicObjects = await r2Service.listObjects('public')
    
    // Filter for HTML files (exclude metadata)
    const htmlFiles = publicObjects.filter(obj => obj.key.endsWith('.html'))
    
    // Get content metadata
    const contentMetadata = await r2Service.getAllPublicContent()
    
    return c.json({
      content: htmlFiles.map(obj => ({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded,
        type: obj.key.split('/')[0], // Extract type from key like "idea/extending-carplay.html"
        slug: obj.key.split('/')[1]?.replace('.html', '') // Extract slug
      })),
      metadata: contentMetadata,
      totalCount: htmlFiles.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching public content:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Failed to fetch public content'
    }, 500)
  }
})

/**
 * GET /api/content/protected
 * 
 * Returns all protected content metadata from R2 buckets.
 * This serves the metadata for protected content (actual content requires auth).
 */
app.get('/protected', async (c) => {
  try {
    const env = c.env
    const r2Service = new R2SyncService(env)
    
    // Get all protected content from R2
    const protectedObjects = await r2Service.listObjects('protected')
    
    // Filter for HTML files (protected content is now stored as HTML)
    const htmlFiles = protectedObjects.filter(obj => obj.key.endsWith('.html'))
    
    return c.json({
      content: htmlFiles.map(obj => ({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded,
        type: obj.key.split('/')[0], // Extract type from key like "idea/local-first-ai.html"
        slug: obj.key.split('/')[1]?.replace('.html', '') // Extract slug
      })),
      totalCount: htmlFiles.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching protected content:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Failed to fetch protected content'
    }, 500)
  }
})

/**
 * GET /api/content/public/:type/:slug
 * 
 * Returns specific public HTML content.
 * This serves the actual HTML content for a specific public page.
 */
app.get('/public/:type/:slug', async (c) => {
  try {
    const env = c.env
    const type = c.req.param('type')
    const slug = c.req.param('slug')
    
    const r2Service = new R2SyncService(env)
    const key = `${type}/${slug}.html`
    
    // Get HTML content from R2
    const htmlContent = await r2Service.getPublicHtml(type, slug)
    
    if (!htmlContent) {
      return c.json({
        error: 'Not Found',
        message: 'Public content not found'
      }, 404)
    }
    
    return c.html(htmlContent)
  } catch (error) {
    console.error('Error fetching public HTML content:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Failed to fetch public content'
    }, 500)
  }
})

export { app as contentRouter }
