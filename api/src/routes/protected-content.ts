import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { accessControlService } from '../services/access-control-service'
import { contentService } from '../services/content-service'
import type { 
  VerifyPasswordRequest, 
  VerifyPasswordResponse, 
  ProtectedContentResponse,
  AccessCheckResponse
} from '../../../types/api'

export const protectedContentRouter = new Hono()

// Helper endpoint to check access requirements for a content item
protectedContentRouter.get('/access/:type/:slug', (c) => {
  const type = c.req.param('type')
  const slug = c.req.param('slug')
  
  const accessMode = accessControlService.getAccessMode(type, slug)
  const rule = accessControlService.getAccessRule(type, slug)
  
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
})

// Helper endpoint to get password for a specific content item (for development)
protectedContentRouter.get('/password/:type/:slug', (c) => {
  const type = c.req.param('type')
  const slug = c.req.param('slug')
  const rule = accessControlService.getAccessRule(type, slug)
  
  if (!rule || rule.mode !== 'password') {
    return c.json({
      error: 'Not Found',
      message: 'Content is not password protected'
    }, 404)
  }
  
  const password = accessControlService.generateContentPassword(type, slug)
  
  return c.json({
    type,
    slug,
    password,
    note: 'Use this password to access the protected content'
  })
})

// Verification endpoint - handles all three access modes
protectedContentRouter.post('/verify', async (c) => {
  try {
    const body = await c.req.json() as VerifyPasswordRequest
    
    // Validate required fields
    if (!body.type || !body.slug) {
      return c.json({ 
        success: false, 
        message: 'Missing required fields: type and slug' 
      } as VerifyPasswordResponse, 400)
    }

    const accessMode = accessControlService.getAccessMode(body.type, body.slug)

    // Handle open access
    if (accessMode === 'open') {
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

      const isValid = await accessControlService.verifyPassword(body.password, body.type, body.slug)
      
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

      const isEmailAllowed = accessControlService.verifyEmail(body.email, body.type, body.slug)
      
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
protectedContentRouter.get('/content/:type/:slug', authMiddleware, async (c) => {
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
