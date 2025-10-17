/**
 * Environment Configuration
 * 
 * This file manages environment variables and configuration settings.
 * In development, you can modify these values directly.
 * In production, these should be set via environment variables.
 */

export const config = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  
  // Development mode flag
  isDev: import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV,
  
  // Mock API mode (only in development)
  useMockApi: import.meta.env.VITE_USE_MOCK_API === 'true' || (import.meta.env.VITE_DEV_MODE === 'true' && !import.meta.env.VITE_API_BASE_URL),
  
  // Environment
  environment: import.meta.env.MODE || 'development',
  
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

// Log configuration in development
if (config.isDev) {
  console.log('🔧 Environment Configuration:', {
    apiBaseUrl: config.apiBaseUrl,
    isDev: config.isDev,
    environment: config.environment
  })
}
