import { useState } from 'react'
import { Button } from './button.tsx'
import { useErrorHandler } from '../hooks/use-error-handler'

export function ErrorTest() {
  const [shouldError, setShouldError] = useState(false)
  const { handleError } = useErrorHandler()

  if (shouldError) {
    throw new Error('This is a test error to demonstrate error boundaries!')
  }

  const triggerGenericError = () => {
    setShouldError(true)
  }

  const triggerNetworkError = async () => {
    try {
      // Simulate a network error
      await fetch('https://nonexistent-domain-12345.com/api/test')
    } catch (error) {
      handleError(error as Error, 'NetworkErrorTest')
    }
  }

  const triggerServerError = () => {
    const error = new Error('Internal Server Error - 500')
    handleError(error, 'ServerErrorTest')
  }

  const triggerNotFoundError = () => {
    const error = new Error('Not Found - 404')
    handleError(error, 'NotFoundErrorTest')
  }

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Error Boundary Test</h3>
      <p className="text-sm text-gray-600 mb-4">
        Test the enhanced error boundary with different error types:
      </p>
      
      <div className="space-y-2">
        <Button 
          onClick={triggerGenericError} 
          className="w-full"
          variant="secondary"
        >
          Trigger Generic Error
        </Button>
        
        <Button 
          onClick={triggerNetworkError} 
          className="w-full"
          variant="secondary"
        >
          Trigger Network Error
        </Button>
        
        <Button 
          onClick={triggerServerError} 
          className="w-full"
          variant="secondary"
        >
          Trigger Server Error
        </Button>
        
        <Button 
          onClick={triggerNotFoundError} 
          className="w-full"
          variant="secondary"
        >
          Trigger Not Found Error
        </Button>
      </div>
      
      <p className="text-xs text-gray-500 mt-4">
        Each button will trigger a different type of error to test the specialized error pages.
      </p>
    </div>
  )
}
