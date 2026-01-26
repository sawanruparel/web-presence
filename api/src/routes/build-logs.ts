/**
 * Build Logs Routes
 * 
 * Provides endpoints for managing and viewing build logs.
 * Protected by admin authentication or API key.
 */

import { Hono } from 'hono'
import type { Env } from '../types/env'
import { adminAuthMiddleware } from '../middleware/admin-auth'
import { apiKeyMiddleware } from '../middleware/api-key'
import { createDatabaseService } from '../services/database-service'

const app = new Hono<{ Bindings: Env }>()

/**
 * POST /api/admin/build-logs
 * 
 * Create a new build log entry.
 * Can be called by build scripts (with API key) or admin users.
 */
app.post('/', async (c) => {
  try {
    // Check for API key or admin auth
    const apiKey = c.req.header('X-API-Key')
    const authHeader = c.req.header('Authorization')
    
    if (!apiKey && (!authHeader || !authHeader.startsWith('Bearer '))) {
      return c.json({ 
        error: 'Unauthorized', 
        message: 'API key or admin token required' 
      }, 401)
    }

    // If API key provided, validate it
    if (apiKey && apiKey !== c.env.INTERNAL_API_KEY) {
      return c.json({ 
        error: 'Unauthorized', 
        message: 'Invalid API key' 
      }, 401)
    }

    // If admin token provided, validate it
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const tokenData = JSON.parse(atob(token))
        if (tokenData.type !== 'admin') {
          return c.json({ 
            error: 'Unauthorized', 
            message: 'Invalid token type' 
          }, 401)
        }
      } catch (error) {
        return c.json({ 
          error: 'Unauthorized', 
          message: 'Invalid token' 
        }, 401)
      }
    }

    const body = await c.req.json() as {
      buildType: 'web' | 'api' | 'full'
      status: 'success' | 'failed' | 'in_progress'
      startedAt: string
      triggeredBy?: 'manual' | 'ci' | 'webhook' | 'api'
      gitCommitSha?: string
      gitBranch?: string
    }

    if (!body.buildType || !body.status || !body.startedAt) {
      return c.json({ 
        error: 'Bad Request',
        message: 'Missing required fields: buildType, status, startedAt' 
      }, 400)
    }

    const dbService = createDatabaseService(c.env.DB)
    const buildLogId = await dbService.createBuildLog({
      buildType: body.buildType,
      status: body.status,
      startedAt: body.startedAt,
      triggeredBy: body.triggeredBy,
      gitCommitSha: body.gitCommitSha,
      gitBranch: body.gitBranch
    })

    return c.json({
      message: 'Build log created successfully',
      id: buildLogId
    }, 201)
  } catch (error) {
    console.error('Error creating build log:', error)
    return c.json({ 
      error: 'Internal Server Error',
      message: 'Failed to create build log',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * PUT /api/admin/build-logs/:id
 * 
 * Update an existing build log entry.
 * Can be called by build scripts (with API key) or admin users.
 */
app.put('/:id', async (c) => {
  try {
    // Check for API key or admin auth
    const apiKey = c.req.header('X-API-Key')
    const authHeader = c.req.header('Authorization')
    
    if (!apiKey && (!authHeader || !authHeader.startsWith('Bearer '))) {
      return c.json({ 
        error: 'Unauthorized', 
        message: 'API key or admin token required' 
      }, 401)
    }

    // If API key provided, validate it
    if (apiKey && apiKey !== c.env.INTERNAL_API_KEY) {
      return c.json({ 
        error: 'Unauthorized', 
        message: 'Invalid API key' 
      }, 401)
    }

    // If admin token provided, validate it
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const tokenData = JSON.parse(atob(token))
        if (tokenData.type !== 'admin') {
          return c.json({ 
            error: 'Unauthorized', 
            message: 'Invalid token type' 
          }, 401)
        }
      } catch (error) {
        return c.json({ 
          error: 'Unauthorized', 
          message: 'Invalid token' 
        }, 401)
      }
    }

    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ 
        error: 'Bad Request',
        message: 'Invalid build log ID' 
      }, 400)
    }

    const body = await c.req.json() as {
      status?: 'success' | 'failed' | 'in_progress'
      completedAt?: string
      durationSeconds?: number
      logOutput?: string
      errorMessage?: string
    }

    const dbService = createDatabaseService(c.env.DB)
    
    // Calculate duration if both started_at and completed_at are provided
    if (body.completedAt) {
      const buildLog = await dbService.getBuildLog(id)
      if (buildLog) {
        const startedAt = new Date(buildLog.started_at)
        const completedAt = new Date(body.completedAt)
        const durationSeconds = Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000)
        body.durationSeconds = durationSeconds
      }
    }

    const updated = await dbService.updateBuildLog(id, body)

    if (!updated) {
      return c.json({ 
        error: 'Bad Request',
        message: 'No fields to update' 
      }, 400)
    }

    return c.json({
      message: 'Build log updated successfully'
    })
  } catch (error) {
    console.error('Error updating build log:', error)
    return c.json({ 
      error: 'Internal Server Error',
      message: 'Failed to update build log',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/admin/build-logs
 * 
 * List all build logs (paginated).
 * Protected by admin authentication.
 */
app.get('/', adminAuthMiddleware, async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50')
    const offset = parseInt(c.req.query('offset') || '0')
    const status = c.req.query('status') as 'success' | 'failed' | 'in_progress' | undefined
    const buildType = c.req.query('buildType') as 'web' | 'api' | 'full' | undefined

    const dbService = createDatabaseService(c.env.DB)
    const buildLogs = await dbService.getBuildLogs({
      limit,
      offset,
      status,
      buildType
    })

    return c.json({
      buildLogs,
      total: buildLogs.length,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching build logs:', error)
    return c.json({ 
      error: 'Internal Server Error',
      message: 'Failed to fetch build logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/admin/build-logs/:id
 * 
 * Get specific build log details.
 * Protected by admin authentication.
 */
app.get('/:id', adminAuthMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ 
        error: 'Bad Request',
        message: 'Invalid build log ID' 
      }, 400)
    }

    const dbService = createDatabaseService(c.env.DB)
    const buildLog = await dbService.getBuildLog(id)

    if (!buildLog) {
      return c.json({ 
        error: 'Not Found',
        message: 'Build log not found' 
      }, 404)
    }

    return c.json({ buildLog })
  } catch (error) {
    console.error('Error fetching build log:', error)
    return c.json({ 
      error: 'Internal Server Error',
      message: 'Failed to fetch build log',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export { app as buildLogsRouter }
