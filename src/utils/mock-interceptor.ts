/**
 * Mock API Interceptor for Development
 * 
 * Intercepts fetch requests to the API in development mode
 * and routes them to the mock API server.
 */

import { config } from '../config/environment'
import { mockApiServer } from './mock-api'

// Store original fetch
const originalFetch = window.fetch

// Mock fetch implementation
async function mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  
  // Check if this is a request to our API
  if (url.startsWith(config.apiBaseUrl)) {
    try {
      console.log('🔧 Mock API intercepting request:', url, init)
      // Route to mock API server
      const response = await mockApiServer.handleRequest(url, init || {})
      console.log('🔧 Mock API response:', response.status, response.statusText)
      return response
    } catch (error) {
      console.error('Mock API error:', error)
      return new Response(JSON.stringify({ error: 'Mock API error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  // For non-API requests, use original fetch
  return originalFetch(input, init)
}

// Initialize mock interceptor
export function initializeMockApi() {
  if (config.isDev && config.useMockApi) {
    // Start mock API server
    mockApiServer.start()
    
    // Override fetch
    window.fetch = mockFetch
    
    console.log('🔧 Mock API Interceptor initialized')
    console.log(`📡 Intercepting requests to: ${config.apiBaseUrl}`)
    console.log('🎭 Using mock API for development')
  } else if (config.isDev) {
    console.log('🔧 Development mode - using real API')
    console.log(`📡 API Base URL: ${config.apiBaseUrl}`)
  }
}

// Cleanup function
export function cleanupMockApi() {
  if (config.isDev) {
    // Restore original fetch
    window.fetch = originalFetch
    
    // Stop mock API server
    mockApiServer.stop()
    
    console.log('🔧 Mock API Interceptor cleaned up')
  }
}
