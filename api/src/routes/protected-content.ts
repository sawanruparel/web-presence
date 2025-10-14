import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { authService } from '../services/auth-service'
import { contentService } from '../services/content-service'
import type { 
  VerifyPasswordRequest, 
  VerifyPasswordResponse, 
  ProtectedContentResponse 
} from '../../../types/api'

export const protectedContentRouter = new Hono()

// Helper endpoint to get password for a specific content item (for development)
protectedContentRouter.get('/password/:type/:slug', (c) => {
  const type = c.req.param('type')
  const slug = c.req.param('slug')
  
  const password = authService.generateContentPassword(type, slug)
  
  return c.json({
    type,
    slug,
    password,
    note: 'Use this password to access the protected content'
  })
})

// Password verification endpoint
protectedContentRouter.post('/verify', async (c) => {
  try {
    const body = await c.req.json() as VerifyPasswordRequest
    
    // Simple validation
    if (!body.type || !body.slug || !body.password) {
      return c.json({ 
        success: false, 
        message: 'Missing required fields' 
      } as VerifyPasswordResponse, 400)
    }

    // Verify password
    const isValid = await authService.verifyPassword(body.password, body.type, body.slug)
    
    if (!isValid) {
      return c.json({ 
        success: false, 
        message: `Invalid password for ${body.type}/${body.slug}. Use the format: ${body.type}-${body.slug}-{hash}` 
      } as VerifyPasswordResponse, 401)
    }

    // Generate JWT token
    const token = await authService.generateToken({
      type: body.type,
      slug: body.slug,
      verifiedAt: new Date().toISOString()
    })

    return c.json({ 
      success: true, 
      token 
    } as VerifyPasswordResponse)
    
  } catch (error) {
    console.error('Password verification error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
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
    console.error('Content retrieval error:', error)
    return c.json({ 
      error: 'Internal Server Error', 
      message: 'Failed to retrieve content' 
    }, 500)
  }
})
