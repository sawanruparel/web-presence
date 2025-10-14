import { Context, Next } from 'hono'
import { jwtVerify } from 'jose'
import type { VerifyPasswordRequest } from '../../../types/api'

export interface AuthContext extends Context {
  get: (key: string) => any
  set: (key: string, value: any) => void
}

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', message: 'Missing or invalid authorization header' }, 401)
  }

  const token = authHeader.substring(7)
  
  try {
    // Simple token verification for now (base64 decode)
    const tokenData = JSON.parse(atob(token))
    
    // Check if token is expired
    if (tokenData.exp && tokenData.exp < Math.floor(Date.now() / 1000)) {
      return c.json({ error: 'Unauthorized', message: 'Token expired' }, 401)
    }
    
    // Store user info in context
    c.set('user', tokenData)
    await next()
  } catch (error) {
    console.error('Token verification error:', error)
    return c.json({ error: 'Unauthorized', message: 'Invalid token' }, 401)
  }
}
