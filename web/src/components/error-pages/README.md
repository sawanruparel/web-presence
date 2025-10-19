# Enhanced Error Handling System

This directory contains specialized error pages that provide a better user experience by showing context-appropriate error messages based on the type of error that occurred.

## Error Pages

### `generic-error.tsx`
- **Purpose**: Default error page for unexpected errors
- **Triggered by**: Generic JavaScript errors, unknown error types
- **Features**: Customizable title/message, retry functionality, error code display

### `network-error.tsx`
- **Purpose**: Network connectivity issues
- **Triggered by**: Fetch failures, network timeouts, connection errors
- **Features**: Troubleshooting tips, retry button, network-specific messaging

### `server-error.tsx`
- **Purpose**: Server-side errors (5xx status codes)
- **Triggered by**: 500, 502, 503, 504 errors, internal server errors
- **Features**: Server error messaging, refresh functionality, support contact

### `not-found.tsx`
- **Purpose**: Page not found errors (404)
- **Triggered by**: 404 errors, missing resources, invalid routes
- **Features**: Navigation options, back button, helpful messaging

## How It Works

The `ErrorBoundary` component automatically detects error types and renders the appropriate specialized page:

```typescript
// Error detection logic
switch (errorType) {
  case 'network':
    return <NetworkErrorPage />
  case 'server':
    return <ServerErrorPage />
  case 'not-found':
    return <NotFoundPage />
  case 'generic':
  default:
    return <GenericErrorPage />
}
```

## Error Type Detection

The system uses `utils/error-detector.ts` to categorize errors based on:

- **Network errors**: `TypeError` with fetch/network keywords
- **Server errors**: Error messages containing 5xx status codes
- **Not found errors**: Error messages containing 404 or "not found"
- **Generic errors**: Everything else

## Usage

### Automatic Error Handling
Errors are automatically caught by the `ErrorBoundary` and the appropriate page is shown.

### Manual Error Handling
Use the `useErrorHandler` hook for programmatic error handling:

```typescript
import { useErrorHandler } from '../hooks/use-error-handler'

function MyComponent() {
  const { handleError } = useErrorHandler()
  
  const handleApiCall = async () => {
    try {
      await fetch('/api/data')
    } catch (error) {
      handleError(error, 'ApiCall')
    }
  }
}
```

### Testing
Use the `ErrorTest` component to test different error types during development.

## Benefits

1. **Better UX**: Users see context-appropriate error messages
2. **Actionable guidance**: Each error type provides relevant troubleshooting steps
3. **Consistent design**: All error pages follow the same design system
4. **Automatic detection**: No manual error categorization needed
5. **Extensible**: Easy to add new error types and pages
