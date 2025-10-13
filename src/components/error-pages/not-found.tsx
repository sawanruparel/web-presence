import { Button } from '../button.tsx'
import { Container } from '../container.tsx'
import { Link } from '../link.tsx'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Container>
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-gray-200 mb-4">404</h1>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Page Not Found
            </h2>
            <p className="text-gray-600 mb-8">
              Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or doesn't exist.
            </p>
          </div>

          <div className="space-y-4">
            <Button href="/" className="w-full">
              Go Home
            </Button>
            <Button
              variant="secondary"
              href="#contact"
              className="w-full"
            >
              Contact Support
            </Button>
          </div>

          <div className="mt-8">
            <p className="text-sm text-gray-500 mb-4">Or try these popular pages:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link
                href="#solutions"
                className="px-3 py-1 text-sm bg-white rounded-full border border-gray-200 hover:bg-gray-50"
              >
                Services
              </Link>
              <Link
                href="#portfolio"
                className="px-3 py-1 text-sm bg-white rounded-full border border-gray-200 hover:bg-gray-50"
              >
                Portfolio
              </Link>
              <Link
                href="#about"
                className="px-3 py-1 text-sm bg-white rounded-full border border-gray-200 hover:bg-gray-50"
              >
                About
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
