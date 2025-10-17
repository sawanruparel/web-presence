import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

import { healthRouter } from './routes/health'
import { protectedContentRouter } from './routes/protected-content'
import { contentCatalogRouter } from './routes/content-catalog'
import { internalRouter } from './routes/internal'
import { errorHandler } from './middleware/error-handler'
import type { Env } from './types/env'

const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors({
  origin: (origin, c) => {
    // Get allowed origins from environment variable
    const allowedOrigins = c.env.CORS_ORIGINS?.split(',').map((o: string) => o.trim()) || [
      'http://localhost:5173'
    ]
    
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return '*'
    
    return allowedOrigins.includes(origin) ? origin : false
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
}))

// Routes
app.route('/health', healthRouter)
app.route('/auth', protectedContentRouter)
app.route('/api', contentCatalogRouter)
app.route('/api/internal', internalRouter)

// Error handling
app.onError(errorHandler)

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', message: 'The requested resource was not found' }, 404)
})

export default app
