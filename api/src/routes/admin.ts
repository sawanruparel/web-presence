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
import { verifyPassword } from '../utils/password'

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
    }>()
    
    for (const { rule, emails } of dbRules) {
      const key = `${rule.type}/${rule.slug}`
      dbRulesMap.set(key, {
        type: rule.type,
        slug: rule.slug,
        accessMode: rule.access_mode,
        description: rule.description,
        allowedEmails: emails
      })
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
      }
      status: 'aligned' | 'github-only' | 'database-only'
    }> = []
    
    for (const key of allKeys) {
      const [type, slug] = key.split('/')
      const githubData = githubContentMap.get(key)
      const dbData = dbRulesMap.get(key)
      
      let status: 'aligned' | 'github-only' | 'database-only'
      if (githubData && dbData) {
        status = 'aligned'
      } else if (githubData && !dbData) {
        status = 'github-only'
      } else {
        status = 'database-only'
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
          allowedEmails: dbData?.allowedEmails
        },
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

export { app as adminRouter }
