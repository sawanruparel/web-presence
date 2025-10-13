import { useState } from 'react'
import { Button } from './button.tsx'
import { useErrorHandler } from '../hooks/use-error-handler'

export function ErrorTest() {
  const [shouldError, setShouldError] = useState(false)
  const { handleError } = useErrorHandler()

  if (shouldError) {
    throw new Error('This is a test error to demonstrate error boundaries!')
  }

  const triggerError = () => {
    setShouldError(true)
  }

  const triggerAsyncError = async () => {
    try {
      // Simulate an async operation that fails
      await new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Async operation failed!'))
        }, 1000)
      })
    } catch (error) {
      handleError(error as Error, 'AsyncErrorTest')
    }
  }

  return (
    <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="text-lg font-semibold text-yellow-800 mb-4">
        Error Boundary Test (Development Only)
      </h3>
      <div className="space-y-2">
        <Button onClick={triggerError} className="mr-2">
          Trigger Sync Error
        </Button>
        <Button onClick={triggerAsyncError} variant="secondary">
          Trigger Async Error
        </Button>
      </div>
      <p className="text-sm text-yellow-700 mt-2">
        These buttons will trigger errors to test the error boundary functionality.
      </p>
    </div>
  )
}
