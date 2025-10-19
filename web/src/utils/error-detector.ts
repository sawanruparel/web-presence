/**
 * Utility functions for detecting and categorizing errors
 */

export type ErrorType = 'network' | 'server' | 'not-found' | 'generic'

/**
 * Detect error type based on error properties
 */
export function detectErrorType(error: Error): ErrorType {
  // Network errors
  if (
    error.name === 'TypeError' && 
    (error.message.includes('fetch') || 
     error.message.includes('network') || 
     error.message.includes('Failed to fetch') ||
     error.message.includes('NetworkError'))
  ) {
    return 'network'
  }

  // Server errors (5xx)
  if (
    error.message.includes('500') || 
    error.message.includes('502') || 
    error.message.includes('503') || 
    error.message.includes('504') ||
    error.message.includes('Internal Server Error') ||
    error.message.includes('Service Unavailable')
  ) {
    return 'server'
  }

  // Not found errors (404)
  if (
    error.message.includes('404') || 
    error.message.includes('Not Found') ||
    error.message.includes('not found') ||
    error.message.includes('Resource not found')
  ) {
    return 'not-found'
  }

  // Default to generic error
  return 'generic'
}

/**
 * Create a typed error for specific error types
 */
export function createTypedError(type: ErrorType, message: string, originalError?: Error): Error {
  const error = new Error(message)
  
  // Add type information to the error
  ;(error as any).errorType = type
  ;(error as any).originalError = originalError
  
  return error
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: Error): boolean {
  return detectErrorType(error) === 'network'
}

/**
 * Check if an error is a server error
 */
export function isServerError(error: Error): boolean {
  return detectErrorType(error) === 'server'
}

/**
 * Check if an error is a not found error
 */
export function isNotFoundError(error: Error): boolean {
  return detectErrorType(error) === 'not-found'
}
