import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { ErrorFallback } from './error-fallback.tsx'
import { errorLogger } from '../utils/error-logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  context?: string
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
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
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.handleReset}
          context={this.props.context}
        />
      )
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
