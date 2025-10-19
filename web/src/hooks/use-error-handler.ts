import { errorLogger } from '../utils/error-logger'

/**
 * Hook for functional components to trigger error boundary
 * This will cause the error boundary to catch the error and display appropriate UI
 */
export function useErrorHandler() {
  const handleError = (error: Error, context?: string) => {
    // Log the error for debugging
    errorLogger.logError({
      error,
      context: context || 'useErrorHandler',
      timestamp: new Date(),
    })
    
    // Re-throw the error to trigger the error boundary
    throw error
  }

  return { handleError }
}
