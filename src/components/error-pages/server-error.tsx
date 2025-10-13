import { Button } from '../button.tsx'
import { Container } from '../container.tsx'

export function ServerErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Container>
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Server Error
            </h1>
            <p className="text-gray-600 mb-8">
              We're experiencing technical difficulties. Our team has been notified and is working to resolve this issue as quickly as possible.
            </p>
          </div>

          <div className="space-y-4">
            <Button href="/" className="w-full">
              Go Home
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Refresh Page
            </Button>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>
              If this problem persists, please{' '}
              <a
                href="mailto:support@webpresence.com"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                contact our support team
              </a>
              {' '}with error code: 500
            </p>
          </div>
        </div>
      </Container>
    </div>
  )
}
