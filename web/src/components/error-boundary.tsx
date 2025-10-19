import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { ErrorFallback } from './error-fallback.tsx'
import { GenericErrorPage } from './error-pages/generic-error'
import { NetworkErrorPage } from './error-pages/network-error'
import { ServerErrorPage } from './error-pages/server-error'
import { NotFoundPage } from './error-pages/not-found'
import { errorLogger } from '../utils/error-logger'
import { detectErrorType, type ErrorType } from '../utils/error-detector'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  context?: string
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorType: ErrorType | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorType: null }
  }

  static getDerivedStateFromError(error: Error): State {
    const errorType = detectErrorType(error)
    return { hasError: true, error, errorType }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { context, onError } = this.props

    // Log the error
    errorLogger.logError({
      error,
      errorInfo,
      context: context || 'ErrorBoundary',
      timestamp: new Date(),
    })

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorType: null })
  }


  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Render specialized error page based on error type
      switch (this.state.errorType) {
        case 'network':
          return <NetworkErrorPage />
        
        case 'server':
          return <ServerErrorPage />
        
        case 'not-found':
          return <NotFoundPage />
        
        case 'generic':
        default:
          return (
            <GenericErrorPage
              title="Something went wrong"
              message="We're sorry, but something unexpected happened. Please try again."
              onRetry={this.handleReset}
            />
          )
      }
    }

    return this.props.children
  }
}

// Hook for functional components to trigger error boundary
export function useErrorHandler() {
  return (error: Error, context?: string) => {
    errorLogger.logError({
      error,
      context: context || 'useErrorHandler',
      timestamp: new Date(),
    })
    throw error
  }
}
