/**
 * API Key Middleware
 * 
 * Protects internal endpoints (build script, admin operations)
 * with API key authentication.
 */

import type { Context, Next } from 'hono'
import type { Env } from '../types/env'

/**
 * Middleware to verify API key for internal endpoints
 * 
 * Checks for X-API-Key header and validates against INTERNAL_API_KEY environment variable
 */
export async function apiKeyMiddleware(
  c: Context<{ Bindings: Env }>,
  next: Next
): Promise<Response | void> {
  const apiKey = c.req.header('X-API-Key')
  const expectedKey = c.env.INTERNAL_API_KEY
  
  if (!apiKey) {
    return c.json(
      {
        error: 'Unauthorized',
        message: 'API key is required. Provide X-API-Key header.'
      },
      401
    )
  }
  
  if (!expectedKey) {
    console.error('INTERNAL_API_KEY environment variable is not set')
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'API key validation is not configured'
      },
      500
    )
  }
  
  if (apiKey !== expectedKey) {
    return c.json(
      {
        error: 'Unauthorized',
        message: 'Invalid API key'
      },
      401
    )
  }
  
  // API key is valid, continue
  await next()
}

/**
 * Helper to check if request has valid API key (for conditional logic)
 */
export function hasValidApiKey(c: Context<{ Bindings: Env }>): boolean {
  const apiKey = c.req.header('X-API-Key')
  const expectedKey = c.env.INTERNAL_API_KEY
  
  return !!(apiKey && expectedKey && apiKey === expectedKey)
}
