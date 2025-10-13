# Error Handling Patterns for AI Tools

This document provides comprehensive error handling patterns and best practices for the Web Presence project.

## 🚨 Error Handling Strategy

### Error Boundary Implementation

**Always wrap components that might error in error boundaries:**

```typescript
// ErrorBoundary component
interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  context?: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    
    // Log error for monitoring
    logError(error, this.props.context || 'ErrorBoundary')
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <ErrorFallback 
          error={this.state.error} 
          context={this.props.context}
        />
      )
    }

    return this.props.children
  }
}
```

### Error Fallback Components

**Create user-friendly error fallback components:**

```typescript
interface ErrorFallbackProps {
  error: Error | null
  context?: string
  onRetry?: () => void
}

export function ErrorFallback({ error, context, onRetry }: ErrorFallbackProps) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Something went wrong
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>
              {context && `Error in ${context}: `}
              {error?.message || 'An unexpected error occurred'}
            </p>
          </div>
          {onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

## 🔧 Error Logging Patterns

### Error Logger Implementation

**Implement comprehensive error logging:**

```typescript
interface ErrorLogEntry {
  timestamp: Date
  level: 'error' | 'warning' | 'info'
  message: string
  context?: string
  stack?: string
  userAgent?: string
  url?: string
  userId?: string
}

class ErrorLogger {
  private logs: ErrorLogEntry[] = []
  private maxLogs = 1000

  logError(error: Error, context?: string): void {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date(),
      level: 'error',
      message: error.message,
      context,
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    this.logs.push(logEntry)
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Send to monitoring service
    this.sendToMonitoring(logEntry)
    
    console.error('Error logged:', logEntry)
  }

  logWarning(message: string, context?: string): void {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date(),
      level: 'warning',
      message,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    this.logs.push(logEntry)
    console.warn('Warning logged:', logEntry)
  }

  logInfo(message: string, context?: string): void {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date(),
      level: 'info',
      message,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    this.logs.push(logEntry)
    console.info('Info logged:', logEntry)
  }

  private sendToMonitoring(logEntry: ErrorLogEntry): void {
    // Send to external monitoring service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: logEntry.message,
        fatal: logEntry.level === 'error'
      })
    }
  }

  getLogs(): ErrorLogEntry[] {
    return [...this.logs]
  }

  clearLogs(): void {
    this.logs = []
  }
}

export const errorLogger = new ErrorLogger()
```

### Custom Error Classes

**Create specific error types for different scenarios:**

```typescript
// Base error class
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// Content errors
export class ContentError extends AppError {
  constructor(message: string, context?: string) {
    super(message, 'CONTENT_ERROR', context, 400)
    this.name = 'ContentError'
  }
}

// Network errors
export class NetworkError extends AppError {
  constructor(message: string, context?: string) {
    super(message, 'NETWORK_ERROR', context, 500)
    this.name = 'NetworkError'
  }
}

// Validation errors
export class ValidationError extends AppError {
  constructor(message: string, context?: string) {
    super(message, 'VALIDATION_ERROR', context, 400)
    this.name = 'ValidationError'
  }
}

// Usage
throw new ContentError('Failed to load content', 'ContentPage')
throw new NetworkError('API request failed', 'DataFetching')
throw new ValidationError('Invalid input data', 'FormValidation')
```

## 🎯 Error Handling in Components

### Component Error Handling

**Handle errors gracefully in components:**

```typescript
interface DataComponentProps {
  dataId: string
}

export function DataComponent({ dataId }: DataComponentProps) {
  const [data, setData] = useState<DataItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const result = await fetchDataById(dataId)
        setData(result)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        errorLogger.logError(error, 'DataComponent')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dataId])

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <ErrorFallback 
        error={error} 
        context="DataComponent"
        onRetry={() => window.location.reload()}
      />
    )
  }

  if (!data) {
    return <EmptyState message="No data found" />
  }

  return (
    <div>
      {/* Render data */}
    </div>
  )
}
```

### Async Error Handling

**Handle async operations with proper error handling:**

```typescript
// Custom hook for async operations
export function useAsyncOperation<T>(
  operation: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await operation()
      setData(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      errorLogger.logError(error, 'useAsyncOperation')
    } finally {
      setLoading(false)
    }
  }, dependencies)

  useEffect(() => {
    execute()
  }, [execute])

  return { data, loading, error, retry: execute }
}

// Usage
function MyComponent() {
  const { data, loading, error, retry } = useAsyncOperation(
    () => fetchData(),
    []
  )

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorFallback error={error} onRetry={retry} />
  if (!data) return <EmptyState />

  return <div>{/* Render data */}</div>
}
```

## 🔄 Error Recovery Patterns

### Retry Logic

**Implement retry logic for failed operations:**

```typescript
interface RetryOptions {
  maxAttempts: number
  delay: number
  backoffMultiplier: number
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {
    maxAttempts: 3,
    delay: 1000,
    backoffMultiplier: 2
  }
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      if (attempt === options.maxAttempts) {
        throw lastError
      }
      
      const delay = options.delay * Math.pow(options.backoffMultiplier, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
      
      errorLogger.logWarning(
        `Operation failed, retrying in ${delay}ms (attempt ${attempt}/${options.maxAttempts})`,
        'retryOperation'
      )
    }
  }
  
  throw lastError!
}

// Usage
const data = await retryOperation(() => fetchData(), {
  maxAttempts: 3,
  delay: 1000,
  backoffMultiplier: 2
})
```

### Circuit Breaker Pattern

**Implement circuit breaker for external services:**

```typescript
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount = 0
  private lastFailureTime = 0
  private readonly failureThreshold: number
  private readonly timeout: number

  constructor(failureThreshold = 5, timeout = 60000) {
    this.failureThreshold = failureThreshold
    this.timeout = timeout
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = CircuitState.HALF_OPEN
      } else {
        throw new Error('Circuit breaker is OPEN')
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failureCount = 0
    this.state = CircuitState.CLOSED
  }

  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN
      errorLogger.logError(
        new Error('Circuit breaker opened due to failures'),
        'CircuitBreaker'
      )
    }
  }
}

// Usage
const circuitBreaker = new CircuitBreaker(5, 60000)

try {
  const data = await circuitBreaker.execute(() => fetchData())
  // Handle success
} catch (error) {
  // Handle error
}
```

## 🎨 Error UI Patterns

### Error States in UI

**Design consistent error states:**

```typescript
// Error message component
interface ErrorMessageProps {
  error: Error | string
  variant?: 'error' | 'warning' | 'info'
  dismissible?: boolean
  onDismiss?: () => void
}

export function ErrorMessage({ 
  error, 
  variant = 'error', 
  dismissible = false,
  onDismiss 
}: ErrorMessageProps) {
  const message = typeof error === 'string' ? error : error.message
  
  const variantClasses = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  return (
    <div className={`p-4 border rounded-lg ${variantClasses[variant]}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {variant === 'error' && (
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          {variant === 'warning' && (
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          {variant === 'info' && (
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        {dismissible && onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className="inline-flex rounded-md p-1.5 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

### Loading and Error States

**Combine loading and error states:**

```typescript
interface AsyncStateProps {
  loading: boolean
  error: Error | null
  data: any
  children: (data: any) => React.ReactNode
  fallback?: React.ReactNode
  errorFallback?: (error: Error) => React.ReactNode
}

export function AsyncState({ 
  loading, 
  error, 
  data, 
  children, 
  fallback,
  errorFallback 
}: AsyncStateProps) {
  if (loading) {
    return fallback || <LoadingSpinner />
  }

  if (error) {
    return errorFallback ? errorFallback(error) : <ErrorFallback error={error} />
  }

  if (!data) {
    return <EmptyState />
  }

  return <>{children(data)}</>
}

// Usage
<AsyncState
  loading={loading}
  error={error}
  data={data}
  fallback={<CustomLoadingSpinner />}
  errorFallback={(error) => <CustomErrorFallback error={error} />}
>
  {(data) => <DataDisplay data={data} />}
</AsyncState>
```

## 🧪 Error Testing Patterns

### Error Boundary Testing

**Test error boundaries:**

```typescript
// Test component that throws
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// Test error boundary
describe('ErrorBoundary', () => {
  it('catches errors and displays fallback', () => {
    const onError = jest.fn()
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object)
    )
  })

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('No error')).toBeInTheDocument()
  })
})
```

### Async Error Testing

**Test async error handling:**

```typescript
describe('useAsyncOperation', () => {
  it('handles errors gracefully', async () => {
    const mockOperation = jest.fn().mockRejectedValue(new Error('Test error'))
    
    const { result } = renderHook(() => useAsyncOperation(mockOperation))
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('Test error')
    })
  })

  it('retries on failure', async () => {
    const mockOperation = jest.fn()
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce('Success')
    
    const { result } = renderHook(() => useAsyncOperation(mockOperation))
    
    await waitFor(() => {
      expect(result.current.data).toBe('Success')
      expect(mockOperation).toHaveBeenCalledTimes(2)
    })
  })
})
```

## 📊 Error Monitoring

### Error Metrics

**Track error metrics:**

```typescript
interface ErrorMetrics {
  totalErrors: number
  errorsByType: Record<string, number>
  errorsByContext: Record<string, number>
  recentErrors: ErrorLogEntry[]
}

class ErrorMetricsCollector {
  private metrics: ErrorMetrics = {
    totalErrors: 0,
    errorsByType: {},
    errorsByContext: {},
    recentErrors: []
  }

  recordError(error: Error, context?: string): void {
    this.metrics.totalErrors++
    
    const errorType = error.constructor.name
    this.metrics.errorsByType[errorType] = (this.metrics.errorsByType[errorType] || 0) + 1
    
    if (context) {
      this.metrics.errorsByContext[context] = (this.metrics.errorsByContext[context] || 0) + 1
    }
    
    this.metrics.recentErrors.push({
      timestamp: new Date(),
      level: 'error',
      message: error.message,
      context,
      stack: error.stack
    })
    
    // Keep only recent errors
    if (this.metrics.recentErrors.length > 100) {
      this.metrics.recentErrors = this.metrics.recentErrors.slice(-100)
    }
  }

  getMetrics(): ErrorMetrics {
    return { ...this.metrics }
  }

  resetMetrics(): void {
    this.metrics = {
      totalErrors: 0,
      errorsByType: {},
      errorsByContext: {},
      recentErrors: []
    }
  }
}

export const errorMetrics = new ErrorMetricsCollector()
```

---

These error handling patterns provide a comprehensive foundation for robust error handling in the Web Presence project.
