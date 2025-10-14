import { useCallback } from 'react'
import { errorLogger } from '../utils/error-logger.ts'

export function useErrorHandler() {
  const handleError = useCallback((error: Error, context?: string) => {
    errorLogger.logError({
      error,
      context: context || 'useErrorHandler',
      timestamp: new Date(),
    })
    throw error
  }, [])

  const handleNetworkError = useCallback((error: Error, url: string, method: string = 'GET') => {
    errorLogger.logNetworkError(error, url, method)
    throw error
  }, [])

  const handleChunkLoadError = useCallback((error: Error, chunkName: string) => {
    errorLogger.logChunkLoadError(error, chunkName)
    throw error
  }, [])

  return {
    handleError,
    handleNetworkError,
    handleChunkLoadError,
  }
}

// Hook for handling async operations with error boundaries
export function useAsyncError() {
  const { handleError } = useErrorHandler()
  
  return useCallback((error: Error) => {
    handleError(error, 'useAsyncError')
  }, [handleError])
}
