import { Button } from '../button.tsx'
import { Container } from '../container.tsx'

export function NetworkErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Container>
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Connection Problem
            </h1>
            <p className="text-gray-600 mb-8">
              We're having trouble connecting to our servers. This might be a temporary network issue or our servers might be experiencing high traffic.
            </p>
          </div>

          <div className="space-y-4">
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
            <Button
              variant="secondary"
              href="/"
              className="w-full"
            >
              Go Home
            </Button>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p className="mb-2">Troubleshooting tips:</p>
            <ul className="text-left space-y-1">
              <li>• Check your internet connection</li>
              <li>• Try refreshing the page</li>
              <li>• Clear your browser cache</li>
              <li>• Try again in a few minutes</li>
            </ul>
          </div>
        </div>
      </Container>
    </div>
  )
}
