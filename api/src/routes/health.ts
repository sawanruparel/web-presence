import { Hono } from 'hono'
import type { HealthResponse } from '../../../types/api'

export const healthRouter = new Hono()

healthRouter.get('/', (c) => {
  const response: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }
  
  return c.json(response)
})
