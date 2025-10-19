import { Button } from '../button.tsx'
import { Container } from '../container.tsx'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Container>
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Page Not Found
            </h1>
            <p className="text-gray-600 mb-8">
              The page you're looking for doesn't exist or may have been moved. Let's get you back on track.
            </p>
          </div>

          <div className="space-y-4">
            <Button href="/" className="w-full">
              Go Home
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.history.back()}
              className="w-full"
            >
              Go Back
            </Button>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>
              If you believe this is an error, please{' '}
              <a
                href="mailto:support@webpresence.com"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                contact our support team
              </a>
            </p>
          </div>
        </div>
      </Container>
    </div>
  )
}
