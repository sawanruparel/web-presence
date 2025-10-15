interface ErrorInfo {
  error: Error
  errorInfo?: React.ErrorInfo
  context?: string
  userId?: string
  timestamp: Date
}

class ErrorLogger {
  private isDevelopment = import.meta.env.DEV

  logError(errorInfo: ErrorInfo): void {
    const { error, errorInfo: reactErrorInfo, context, userId, timestamp } = errorInfo

    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context: context || 'Unknown',
      userId: userId || 'anonymous',
      timestamp: timestamp.toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      reactErrorInfo: reactErrorInfo ? {
        componentStack: reactErrorInfo.componentStack,
      } : undefined,
    }

    // Always log to console in development
    if (this.isDevelopment) {
      console.group('🚨 Error Boundary Caught Error')
      console.error('Error:', error)
      console.error('Error Info:', reactErrorInfo)
      console.error('Context:', context)
      console.error('Full Error Data:', errorData)
      console.groupEnd()
    }

    // In production, you would typically send to an error reporting service
    // For now, we'll just log to console
    console.error('Production Error:', errorData)

    // TODO: Integrate with error reporting service like Sentry, LogRocket, etc.
    // Example: Sentry.captureException(error, { extra: errorData })
  }

  logNetworkError(error: Error, url: string, method: string = 'GET'): void {
    this.logError({
      error,
      context: `Network Error: ${method} ${url}`,
      timestamp: new Date(),
    })
  }

  logChunkLoadError(error: Error, chunkName: string): void {
    this.logError({
      error,
      context: `Chunk Load Error: ${chunkName}`,
      timestamp: new Date(),
    })
  }
}

export const errorLogger = new ErrorLogger()
