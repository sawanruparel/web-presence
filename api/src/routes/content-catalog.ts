/**
 * Content Catalog Routes
 * 
 * Provides content catalog endpoint for build script to fetch access rules.
 * Protected by API key authentication.
 */

import { Hono } from 'hono'
import type { Env } from '../types/env'
import { createDatabaseService } from '../services/database-service'
import { apiKeyMiddleware } from '../middleware/api-key'

const app = new Hono<{ Bindings: Env }>()

/**
 * GET /api/content-catalog
 * 
 * Returns all content access rules with email allowlists.
 * Used by build script to determine which content is public vs protected.
 * 
 * Requires: X-API-Key header
 * 
 * Response:
 * {
 *   "rules": [
 *     {
 *       "type": "notes",
 *       "slug": "my-note",
 *       "accessMode": "open",
 *       "description": "My note",
 *       "allowedEmails": []
 *     }
 *   ]
 * }
 */
app.get('/content-catalog', apiKeyMiddleware, async (c) => {
  try {
    const dbService = createDatabaseService(c.env.DB)
    
    // Get all access rules with their email allowlists
    const rulesWithEmails = await dbService.getAllAccessRulesWithEmails()
    
    // Transform to API format
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
      rules,
      totalCount: rules.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching content catalog:', error)
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch content catalog'
      },
      500
    )
  }
})

/**
 * GET /api/content-catalog/:type
 * 
 * Returns access rules for a specific content type.
 * 
 * Requires: X-API-Key header
 */
app.get('/content-catalog/:type', apiKeyMiddleware, async (c) => {
  try {
    const type = c.req.param('type')
    const dbService = createDatabaseService(c.env.DB)
    
    // Get rules for this type
    const rules = await dbService.getAccessRulesByType(type)
    
    // Get emails for each rule
    const rulesWithEmails = await Promise.all(
      rules.map(async (rule) => ({
        type: rule.type,
        slug: rule.slug,
        accessMode: rule.access_mode,
        description: rule.description || undefined,
        requiresPassword: rule.access_mode === 'password',
        requiresEmail: rule.access_mode === 'email-list',
        allowedEmails: rule.access_mode === 'email-list' 
          ? await dbService.getEmailsForRule(rule.id)
          : undefined
      }))
    )
    
    return c.json({
      type,
      rules: rulesWithEmails,
      count: rulesWithEmails.length
    })
  } catch (error) {
    console.error('Error fetching content catalog by type:', error)
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch content catalog'
      },
      500
    )
  }
})

export { app as contentCatalogRouter }
