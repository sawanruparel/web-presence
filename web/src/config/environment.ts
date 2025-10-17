/**
 * Environment Configuration
 * 
 * This file manages environment variables and configuration settings.
 * In development, you can modify these values directly.
 * In production, these should be set via environment variables.
 */

export const config = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787',
  
  // Development mode flag
  isDev: import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV,
  
  // Environment
  environment: import.meta.env.VITE_NODE_ENV || import.meta.env.MODE || 'development',
  
  // Debug logging flag
  debug: import.meta.env.VITE_DEBUG === 'true',
  
  // API endpoints
  endpoints: {
    verifyPassword: '/auth/verify',
    protectedContent: '/auth/content',
    accessCheck: '/auth/access',
    health: '/health'
  }
} as const

// Helper functions
export const isDevelopment = () => config.isDev
export const isProduction = () => !config.isDev
export const getApiUrl = (endpoint: string) => `${config.apiBaseUrl}${endpoint}`

// Log configuration in development or when debug is enabled
if (config.isDev || config.debug) {
  console.log('🔧 Environment Configuration:', {
    apiBaseUrl: config.apiBaseUrl,
    isDev: config.isDev,
    environment: config.environment,
    debug: config.debug
  })
}
