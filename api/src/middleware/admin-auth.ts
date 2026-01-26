/**
 * Admin Authentication Middleware
 * 
 * Validates admin session tokens for protected admin routes.
 * Similar to authMiddleware but specifically for admin endpoints.
 */

import type { Context, Next } from 'hono'

export async function adminAuthMiddleware(
  c: Context,
  next: Next
): Promise<Response | void> {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ 
      error: 'Unauthorized', 
      message: 'Missing or invalid authorization header' 
    }, 401)
  }

  const token = authHeader.substring(7)
  
  try {
    // Decode token (base64 encoded JSON)
    const tokenData = JSON.parse(atob(token))
    
    // Verify it's an admin token
    if (tokenData.type !== 'admin') {
      return c.json({ 
        error: 'Unauthorized', 
        message: 'Invalid token type' 
      }, 401)
    }
    
    // Check if token is expired
    if (tokenData.exp && tokenData.exp < Math.floor(Date.now() / 1000)) {
      return c.json({ 
        error: 'Unauthorized', 
        message: 'Token expired' 
      }, 401)
    }
    
    // Store admin info in context
    c.set('admin', tokenData)
    await next()
  } catch (error) {
    console.error('Admin token verification error:', error)
    return c.json({ 
      error: 'Unauthorized', 
      message: 'Invalid token' 
    }, 401)
  }
}
