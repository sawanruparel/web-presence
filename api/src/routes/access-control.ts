import { Hono } from 'hono'
import type { Context } from 'hono'
import type { Env } from '../types/env'

const accessControlRouter = new Hono<{ Bindings: Env }>()

export interface AccessRule {
  id?: number
  type: string
  slug: string
  accessMode: 'open' | 'password' | 'email-list'
  description?: string
  passwordHash?: string
  allowedEmails?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface AccessRuleUpdate {
  accessMode?: 'open' | 'password' | 'email-list'
  description?: string
  password?: string
  allowedEmails?: string[]
}

/**
 * Get all access rules
 */
accessControlRouter.get('/rules', async (c: Context) => {
  try {
    const env = c.env

    // Validate API key
    const apiKey = c.req.header('X-API-Key')
    if (apiKey !== env.INTERNAL_API_KEY) {
      return c.json({ error: 'Invalid API key' }, 401)
    }

    // Get all access rules with their email allowlists
    const rulesQuery = `
      SELECT 
        car.id,
        car.type,
        car.slug,
        car.access_mode as accessMode,
        car.description,
        car.password_hash as passwordHash,
        car.created_at as createdAt,
        car.updated_at as updatedAt,
        GROUP_CONCAT(ea.email) as allowedEmails
      FROM content_access_rules car
      LEFT JOIN email_allowlist ea ON car.id = ea.access_rule_id
      GROUP BY car.id, car.type, car.slug, car.access_mode, car.description, car.password_hash, car.created_at, car.updated_at
      ORDER BY car.type, car.slug
    `

    const result = await env.DB.prepare(rulesQuery).all()

    const rules = result.results.map((rule: any) => ({
      id: rule.id,
      type: rule.type,
      slug: rule.slug,
      accessMode: rule.accessMode,
      description: rule.description,
      passwordHash: rule.passwordHash,
      allowedEmails: rule.allowedEmails ? rule.allowedEmails.split(',') : [],
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt
    }))

    return c.json({
      rules,
      count: rules.length
    }, 200)

  } catch (error) {
    console.error('❌ Failed to get access rules:', error)
    return c.json({ 
      error: 'Failed to get access rules',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * Get access rule for specific content
 */
accessControlRouter.get('/rules/:type/:slug', async (c: Context) => {
  try {
    const env = c.env
    const type = c.req.param('type')
    const slug = c.req.param('slug')

    // Validate API key
    const apiKey = c.req.header('X-API-Key')
    if (apiKey !== env.INTERNAL_API_KEY) {
      return c.json({ error: 'Invalid API key' }, 401)
    }

    // Get access rule with email allowlist
    const ruleQuery = `
      SELECT 
        car.id,
        car.type,
        car.slug,
        car.access_mode as accessMode,
        car.description,
        car.password_hash as passwordHash,
        car.created_at as createdAt,
        car.updated_at as updatedAt,
        GROUP_CONCAT(ea.email) as allowedEmails
      FROM content_access_rules car
      LEFT JOIN email_allowlist ea ON car.id = ea.access_rule_id
      WHERE car.type = ? AND car.slug = ?
      GROUP BY car.id, car.type, car.slug, car.access_mode, car.description, car.password_hash, car.created_at, car.updated_at
    `

    const result = await env.DB.prepare(ruleQuery).bind(type, slug).first()

    if (!result) {
      return c.json({ error: 'Access rule not found' }, 404)
    }

    const rule = {
      id: result.id,
      type: result.type,
      slug: result.slug,
      accessMode: result.accessMode,
      description: result.description,
      passwordHash: result.passwordHash,
      allowedEmails: result.allowedEmails ? result.allowedEmails.split(',') : [],
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    }

    return c.json(rule, 200)

  } catch (error) {
    console.error('❌ Failed to get access rule:', error)
    return c.json({ 
      error: 'Failed to get access rule',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * Create or update access rule
 */
accessControlRouter.post('/rules', async (c: Context) => {
  try {
    const env = c.env
    const body = await c.req.json() as AccessRule

    // Validate API key
    const apiKey = c.req.header('X-API-Key')
    if (apiKey !== env.INTERNAL_API_KEY) {
      return c.json({ error: 'Invalid API key' }, 401)
    }

    // Validate required fields
    if (!body.type || !body.slug || !body.accessMode) {
      return c.json({ 
        error: 'Missing required fields: type, slug, accessMode' 
      }, 400)
    }

    // Hash password if provided
    let passwordHash = null
    if (body.accessMode === 'password' && body.passwordHash) {
      passwordHash = body.passwordHash // Assume already hashed
    }

    // Start transaction
    const insertRuleQuery = `
      INSERT OR REPLACE INTO content_access_rules 
      (type, slug, access_mode, description, password_hash, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `

    const result = await env.DB.prepare(insertRuleQuery)
      .bind(body.type, body.slug, body.accessMode, body.description || null, passwordHash)
      .run()

    const ruleId = result.meta.last_row_id

    // Update email allowlist if provided
    if (body.allowedEmails && body.allowedEmails.length > 0) {
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

    return c.json({
      message: 'Access rule created/updated successfully',
      ruleId,
      type: body.type,
      slug: body.slug
    }, 200)

  } catch (error) {
    console.error('❌ Failed to create/update access rule:', error)
    return c.json({ 
      error: 'Failed to create/update access rule',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * Update access rule
 */
accessControlRouter.put('/rules/:type/:slug', async (c: Context) => {
  try {
    const env = c.env
    const type = c.req.param('type')
    const slug = c.req.param('slug')
    const body = await c.req.json() as AccessRuleUpdate

    // Validate API key
    const apiKey = c.req.header('X-API-Key')
    if (apiKey !== env.INTERNAL_API_KEY) {
      return c.json({ error: 'Invalid API key' }, 401)
    }

    // Get existing rule
    const existingRule = await env.DB.prepare(
      'SELECT id FROM content_access_rules WHERE type = ? AND slug = ?'
    ).bind(type, slug).first()

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
      // Hash the password (in production, use bcrypt)
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

    return c.json({
      message: 'Access rule updated successfully',
      ruleId,
      type,
      slug
    }, 200)

  } catch (error) {
    console.error('❌ Failed to update access rule:', error)
    return c.json({ 
      error: 'Failed to update access rule',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * Delete access rule
 */
accessControlRouter.delete('/rules/:type/:slug', async (c: Context) => {
  try {
    const env = c.env
    const type = c.req.param('type')
    const slug = c.req.param('slug')

    // Validate API key
    const apiKey = c.req.header('X-API-Key')
    if (apiKey !== env.INTERNAL_API_KEY) {
      return c.json({ error: 'Invalid API key' }, 401)
    }

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
    console.error('❌ Failed to delete access rule:', error)
    return c.json({ 
      error: 'Failed to delete access rule',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * Get access logs (with pagination)
 */
accessControlRouter.get('/logs', async (c: Context) => {
  try {
    const env = c.env
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '50')
    const offset = (page - 1) * limit

    // Validate API key
    const apiKey = c.req.header('X-API-Key')
    if (apiKey !== env.INTERNAL_API_KEY) {
      return c.json({ error: 'Invalid API key' }, 401)
    }

    // Get access logs with pagination
    const logsQuery = `
      SELECT 
        al.id,
        al.type,
        al.slug,
        al.access_granted as accessGranted,
        al.credential_type as credentialType,
        al.credential_value as credentialValue,
        al.ip_address as ipAddress,
        al.user_agent as userAgent,
        al.timestamp,
        car.access_mode as accessMode
      FROM access_logs al
      LEFT JOIN content_access_rules car ON al.access_rule_id = car.id
      ORDER BY al.timestamp DESC
      LIMIT ? OFFSET ?
    `

    const countQuery = 'SELECT COUNT(*) as total FROM access_logs'

    const [logsResult, countResult] = await Promise.all([
      env.DB.prepare(logsQuery).bind(limit, offset).all(),
      env.DB.prepare(countQuery).first()
    ])

    const total = countResult?.total || 0
    const totalPages = Math.ceil(total / limit)

    return c.json({
      logs: logsResult.results,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }, 200)

  } catch (error) {
    console.error('❌ Failed to get access logs:', error)
    return c.json({ 
      error: 'Failed to get access logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * Simple password hashing (in production, use bcrypt)
 */
async function hashPassword(password: string): Promise<string> {
  // This is a simple hash for demo purposes
  // In production, use bcrypt or similar
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export { accessControlRouter }
