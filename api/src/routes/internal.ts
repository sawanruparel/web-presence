/**
 * Internal Admin Routes
 * 
 * Provides CRUD operations for access rules and email allowlists.
 * All endpoints protected by API key authentication.
 */

import { Hono } from 'hono'
import type { Env } from '../types/env'
import { createDatabaseService } from '../services/database-service'
import { apiKeyMiddleware } from '../middleware/api-key'
import { hashPassword } from '../utils/password'
import type { AccessMode } from '../../../types/api'

const app = new Hono<{ Bindings: Env }>()

// Apply API key middleware to all routes
app.use('*', apiKeyMiddleware)

// ============================================================
// Access Rules Management
// ============================================================

/**
 * GET /api/internal/access-rules
 * 
 * Get all access rules or filter by query params
 * 
 * Query params:
 * - type: Filter by content type
 * - mode: Filter by access mode
 */
app.get('/access-rules', async (c) => {
  try {
    const type = c.req.query('type')
    const mode = c.req.query('mode') as AccessMode | undefined
    
    const dbService = createDatabaseService(c.env.DB)
    
    let rules
    if (type) {
      rules = await dbService.getAccessRulesByType(type)
    } else if (mode) {
      rules = await dbService.getAccessRulesByMode(mode)
    } else {
      rules = await dbService.getAllAccessRules()
    }
    
    // Get emails for email-list rules
    const rulesWithEmails = await Promise.all(
      rules.map(async (rule) => ({
        ...rule,
        allowedEmails: rule.access_mode === 'email-list'
          ? await dbService.getEmailsForRule(rule.id)
          : undefined
      }))
    )
    
    return c.json({
      rules: rulesWithEmails,
      count: rulesWithEmails.length
    })
  } catch (error) {
    console.error('Error fetching access rules:', error)
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch access rules'
      },
      500
    )
  }
})

/**
 * GET /api/internal/access-rules/:type/:slug
 * 
 * Get specific access rule
 */
app.get('/access-rules/:type/:slug', async (c) => {
  try {
    const type = c.req.param('type')
    const slug = c.req.param('slug')
    
    const dbService = createDatabaseService(c.env.DB)
    const { rule, emails } = await dbService.getAccessRuleWithEmails(type, slug)
    
    if (!rule) {
      return c.json(
        {
          error: 'Not Found',
          message: `Access rule not found for ${type}/${slug}`
        },
        404
      )
    }
    
    return c.json({
      ...rule,
      allowedEmails: rule.access_mode === 'email-list' ? emails : undefined
    })
  } catch (error) {
    console.error('Error fetching access rule:', error)
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch access rule'
      },
      500
    )
  }
})

/**
 * POST /api/internal/access-rules
 * 
 * Create new access rule
 * 
 * Body:
 * {
 *   "type": "notes",
 *   "slug": "my-note",
 *   "accessMode": "open|password|email-list",
 *   "description": "Optional description",
 *   "password": "plain-password" (for password mode),
 *   "allowedEmails": ["email@example.com"] (for email-list mode)
 * }
 */
app.post('/access-rules', async (c) => {
  try {
    const body = await c.req.json()
    
    // Validate required fields
    if (!body.type || !body.slug || !body.accessMode) {
      return c.json(
        {
          error: 'Bad Request',
          message: 'Missing required fields: type, slug, accessMode'
        },
        400
      )
    }
    
    const dbService = createDatabaseService(c.env.DB)
    
    // Check if rule already exists
    const existing = await dbService.getAccessRule(body.type, body.slug)
    if (existing) {
      return c.json(
        {
          error: 'Conflict',
          message: `Access rule already exists for ${body.type}/${body.slug}`
        },
        409
      )
    }
    
    // Hash password if provided
    let passwordHash: string | undefined
    if (body.accessMode === 'password') {
      if (!body.password) {
        return c.json(
          {
            error: 'Bad Request',
            message: 'Password is required for password mode'
          },
          400
        )
      }
      passwordHash = await hashPassword(body.password)
    }
    
    // Create access rule
    const rule = await dbService.createAccessRule({
      type: body.type,
      slug: body.slug,
      access_mode: body.accessMode,
      description: body.description,
      password_hash: passwordHash
    })
    
    // Add emails if provided
    if (body.accessMode === 'email-list' && body.allowedEmails) {
      if (!Array.isArray(body.allowedEmails)) {
        return c.json(
          {
            error: 'Bad Request',
            message: 'allowedEmails must be an array'
          },
          400
        )
      }
      
      await dbService.replaceEmailsForRule(rule.id, body.allowedEmails)
    }
    
    // Get final rule with emails
    const { rule: finalRule, emails } = await dbService.getAccessRuleWithEmails(
      body.type,
      body.slug
    )
    
    return c.json(
      {
        ...finalRule,
        allowedEmails: finalRule?.access_mode === 'email-list' ? emails : undefined
      },
      201
    )
  } catch (error) {
    console.error('Error creating access rule:', error)
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to create access rule'
      },
      500
    )
  }
})

/**
 * PUT /api/internal/access-rules/:type/:slug
 * 
 * Update existing access rule
 * 
 * Body:
 * {
 *   "accessMode": "open|password|email-list",
 *   "description": "Updated description",
 *   "password": "new-password" (optional, for password mode),
 *   "allowedEmails": ["email@example.com"] (optional, for email-list mode)
 * }
 */
app.put('/access-rules/:type/:slug', async (c) => {
  try {
    const type = c.req.param('type')
    const slug = c.req.param('slug')
    const body = await c.req.json()
    
    const dbService = createDatabaseService(c.env.DB)
    
    // Check if rule exists
    const existing = await dbService.getAccessRule(type, slug)
    if (!existing) {
      return c.json(
        {
          error: 'Not Found',
          message: `Access rule not found for ${type}/${slug}`
        },
        404
      )
    }
    
    // Hash password if provided
    let passwordHash: string | undefined
    if (body.password) {
      passwordHash = await hashPassword(body.password)
    }
    
    // Update access rule
    const updatedRule = await dbService.updateAccessRule(type, slug, {
      access_mode: body.accessMode,
      description: body.description,
      password_hash: passwordHash
    })
    
    // Update emails if provided
    if (body.allowedEmails) {
      if (!Array.isArray(body.allowedEmails)) {
        return c.json(
          {
            error: 'Bad Request',
            message: 'allowedEmails must be an array'
          },
          400
        )
      }
      
      await dbService.replaceEmailsForRule(updatedRule.id, body.allowedEmails)
    }
    
    // Get final rule with emails
    const { rule: finalRule, emails } = await dbService.getAccessRuleWithEmails(type, slug)
    
    return c.json({
      ...finalRule,
      allowedEmails: finalRule?.access_mode === 'email-list' ? emails : undefined
    })
  } catch (error) {
    console.error('Error updating access rule:', error)
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to update access rule'
      },
      500
    )
  }
})

/**
 * DELETE /api/internal/access-rules/:type/:slug
 * 
 * Delete access rule
 */
app.delete('/access-rules/:type/:slug', async (c) => {
  try {
    const type = c.req.param('type')
    const slug = c.req.param('slug')
    
    const dbService = createDatabaseService(c.env.DB)
    
    const deleted = await dbService.deleteAccessRule(type, slug)
    
    if (!deleted) {
      return c.json(
        {
          error: 'Not Found',
          message: `Access rule not found for ${type}/${slug}`
        },
        404
      )
    }
    
    return c.json({
      message: 'Access rule deleted successfully',
      type,
      slug
    })
  } catch (error) {
    console.error('Error deleting access rule:', error)
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to delete access rule'
      },
      500
    )
  }
})

// ============================================================
// Email Allowlist Management
// ============================================================

/**
 * POST /api/internal/access-rules/:type/:slug/emails
 * 
 * Add email to allowlist
 * 
 * Body:
 * {
 *   "email": "user@example.com"
 * }
 */
app.post('/access-rules/:type/:slug/emails', async (c) => {
  try {
    const type = c.req.param('type')
    const slug = c.req.param('slug')
    const body = await c.req.json()
    
    if (!body.email) {
      return c.json(
        {
          error: 'Bad Request',
          message: 'Email is required'
        },
        400
      )
    }
    
    const dbService = createDatabaseService(c.env.DB)
    
    // Get access rule
    const rule = await dbService.getAccessRule(type, slug)
    if (!rule) {
      return c.json(
        {
          error: 'Not Found',
          message: `Access rule not found for ${type}/${slug}`
        },
        404
      )
    }
    
    if (rule.access_mode !== 'email-list') {
      return c.json(
        {
          error: 'Bad Request',
          message: 'Can only add emails to email-list access mode'
        },
        400
      )
    }
    
    // Add email
    await dbService.addEmailToAllowlist(rule.id, body.email)
    
    // Get updated list
    const emails = await dbService.getEmailsForRule(rule.id)
    
    return c.json({
      message: 'Email added to allowlist',
      email: body.email.toLowerCase().trim(),
      allowedEmails: emails
    }, 201)
  } catch (error) {
    if (error instanceof Error && error.message?.includes('UNIQUE constraint')) {
      return c.json(
        {
          error: 'Conflict',
          message: 'Email already in allowlist'
        },
        409
      )
    }
    
    console.error('Error adding email to allowlist:', error)
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to add email to allowlist'
      },
      500
    )
  }
})

/**
 * DELETE /api/internal/access-rules/:type/:slug/emails/:email
 * 
 * Remove email from allowlist
 */
app.delete('/access-rules/:type/:slug/emails/:email', async (c) => {
  try {
    const type = c.req.param('type')
    const slug = c.req.param('slug')
    const email = c.req.param('email')
    
    const dbService = createDatabaseService(c.env.DB)
    
    // Get access rule
    const rule = await dbService.getAccessRule(type, slug)
    if (!rule) {
      return c.json(
        {
          error: 'Not Found',
          message: `Access rule not found for ${type}/${slug}`
        },
        404
      )
    }
    
    // Remove email
    const removed = await dbService.removeEmailFromAllowlist(rule.id, email)
    
    if (!removed) {
      return c.json(
        {
          error: 'Not Found',
          message: 'Email not found in allowlist'
        },
        404
      )
    }
    
    // Get updated list
    const emails = await dbService.getEmailsForRule(rule.id)
    
    return c.json({
      message: 'Email removed from allowlist',
      email: email.toLowerCase().trim(),
      allowedEmails: emails
    })
  } catch (error) {
    console.error('Error removing email from allowlist:', error)
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to remove email from allowlist'
      },
      500
    )
  }
})

// ============================================================
// Analytics & Logs
// ============================================================

/**
 * GET /api/internal/logs
 * 
 * Get access logs
 * 
 * Query params:
 * - limit: Number of logs to return (default 100)
 * - failed: Only failed attempts (true/false)
 * - type: Filter by content type
 * - slug: Filter by content slug
 */
app.get('/logs', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100')
    const failed = c.req.query('failed') === 'true'
    const type = c.req.query('type')
    const slug = c.req.query('slug')
    
    const dbService = createDatabaseService(c.env.DB)
    
    let logs
    if (type && slug) {
      logs = await dbService.getAccessLogsForContent(type, slug, limit)
    } else if (failed) {
      logs = await dbService.getFailedAccessAttempts(limit)
    } else {
      logs = await dbService.getRecentAccessLogs(limit)
    }
    
    return c.json({
      logs,
      count: logs.length,
      limit
    })
  } catch (error) {
    console.error('Error fetching logs:', error)
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch logs'
      },
      500
    )
  }
})

/**
 * GET /api/internal/stats
 * 
 * Get access statistics
 * 
 * Query params:
 * - start: Start date (ISO 8601)
 * - end: End date (ISO 8601)
 */
app.get('/stats', async (c) => {
  try {
    const start = c.req.query('start')
    const end = c.req.query('end')
    
    const dbService = createDatabaseService(c.env.DB)
    const stats = await dbService.getAccessStats(start, end)
    
    return c.json({
      stats,
      period: {
        start: start || 'beginning',
        end: end || 'now'
      }
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch stats'
      },
      500
    )
  }
})

export { app as internalRouter }
