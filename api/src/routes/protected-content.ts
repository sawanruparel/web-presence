import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { createAccessControlService } from '../services/access-control-service'
import { contentService } from '../services/content-service'
import type { Env } from '../types/env'
import type { 
  VerifyPasswordRequest, 
  VerifyPasswordResponse, 
  ProtectedContentResponse,
  AccessCheckResponse
} from '../../../types/api'

const app = new Hono<{ Bindings: Env }>()

// Helper endpoint to check access requirements for a content item
app.get('/access/:type/:slug', async (c) => {
  try {
    const type = c.req.param('type')
    const slug = c.req.param('slug')
    
    const accessControlService = createAccessControlService(c.env.DB)
    const accessMode = await accessControlService.getAccessMode(type, slug)
    const rule = await accessControlService.getAccessRule(type, slug)
    
    if (!rule) {
      return c.json({
        message: 'Content not found'
      }, 404)
    }

    return c.json({
      accessMode,
      requiresPassword: accessMode === 'password',
      requiresEmail: accessMode === 'email-list',
      message: rule.description
    } as AccessCheckResponse)
  } catch (error) {
    console.error('Error checking access:', error)
    return c.json({
      error: 'Internal Server Error',
      message: 'Failed to check access'
    }, 500)
  }
})

// Verification endpoint - handles all three access modes
app.post('/verify', async (c) => {
  try {
    const body = await c.req.json() as VerifyPasswordRequest
    
    // Validate required fields
    if (!body.type || !body.slug) {
      return c.json({ 
        success: false, 
        message: 'Missing required fields: type and slug' 
      } as VerifyPasswordResponse, 400)
    }

    // Get client info for logging
    const ipAddress = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for')
    const userAgent = c.req.header('user-agent')

    const accessControlService = createAccessControlService(c.env.DB)
    const accessMode = await accessControlService.getAccessMode(body.type, body.slug)

    // Handle open access
    if (accessMode === 'open') {
      // Log the access
      await accessControlService.logOpenAccess(body.type, body.slug, ipAddress, userAgent)

      const token = await accessControlService.generateToken({
        type: body.type,
        slug: body.slug,
        verifiedAt: new Date().toISOString()
      })

      return c.json({ 
        success: true, 
        token,
        accessMode: 'open'
      } as VerifyPasswordResponse)
    }

    // Handle password-protected content
    if (accessMode === 'password') {
      if (!body.password) {
        return c.json({ 
          success: false, 
          message: 'Password is required for this content' 
        } as VerifyPasswordResponse, 400)
      }

      const isValid = await accessControlService.verifyPassword(
        body.password, 
        body.type, 
        body.slug,
        ipAddress,
        userAgent
      )
      
      if (!isValid) {
        return c.json({ 
          success: false, 
          message: `Invalid password for ${body.type}/${body.slug}` 
        } as VerifyPasswordResponse, 401)
      }

      const token = await accessControlService.generateToken({
        type: body.type,
        slug: body.slug,
        verifiedAt: new Date().toISOString()
      })

      return c.json({ 
        success: true, 
        token,
        accessMode: 'password'
      } as VerifyPasswordResponse)
    }

    // Handle email-list protected content
    if (accessMode === 'email-list') {
      if (!body.email) {
        return c.json({ 
          success: false, 
          message: 'Email is required for this content' 
        } as VerifyPasswordResponse, 400)
      }

      const isEmailAllowed = await accessControlService.verifyEmail(
        body.email, 
        body.type, 
        body.slug,
        ipAddress,
        userAgent
      )
      
      if (!isEmailAllowed) {
        return c.json({ 
          success: false, 
          message: `Your email is not authorized to access this content` 
        } as VerifyPasswordResponse, 401)
      }

      const token = await accessControlService.generateToken({
        type: body.type,
        slug: body.slug,
        email: body.email,
        verifiedAt: new Date().toISOString()
      })

      return c.json({ 
        success: true, 
        token,
        accessMode: 'email-list'
      } as VerifyPasswordResponse)
    }

    return c.json({ 
      success: false, 
      message: 'Unknown access mode' 
    } as VerifyPasswordResponse, 500)
    
  } catch (error) {
    return c.json({ 
      success: false, 
      message: 'Internal server error' 
    } as VerifyPasswordResponse, 500)
  }
})

// Protected content retrieval endpoint
app.get('/content/:type/:slug', authMiddleware, async (c) => {
  try {
    const type = c.req.param('type') as 'notes' | 'publications' | 'ideas' | 'pages'
    const slug = c.req.param('slug')
    
    // Get content from service
    const content = await contentService.getProtectedContent(type, slug)
    
    if (!content) {
      return c.json({ 
        error: 'Not Found', 
        message: 'Content not found' 
      }, 404)
    }

    return c.json(content as ProtectedContentResponse)
    
  } catch (error) {
    return c.json({ 
      error: 'Internal Server Error', 
      message: 'Failed to retrieve content' 
    }, 500)
  }
})

export { app as protectedContentRouter }
