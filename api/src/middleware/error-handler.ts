import { Context } from 'hono'

export const errorHandler = (err: Error, c: Context) => {
  console.error('API Error:', err)
  
  return c.json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  }, 500)
}
