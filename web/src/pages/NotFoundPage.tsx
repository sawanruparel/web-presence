import { Helmet } from 'react-helmet-async'
import { Footer } from '../components/footer'
import { PageNavigation } from '../components/page-navigation'
import { navigateTo } from '../utils/router'

export function NotFoundPage() {
  return (
    <main
      className="mx-auto max-w-2xl px-4 py-12 leading-relaxed"
      style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}
    >
      <Helmet>
        <title>Page Not Found — Sawan Ruparel</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <header>
        <PageNavigation currentPage="about" />
      </header>

      <section className="mt-20 text-center">
        <p className="text-6xl mb-6" style={{ color: 'var(--color-text-muted)' }}>404</p>
        <h1 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
          Page not found
        </h1>
        <p className="mb-8" style={{ color: 'var(--color-text-muted)' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigateTo('/')}
          className="text-sm underline"
          style={{ color: 'var(--color-accent)' }}
        >
          Go back home
        </button>
      </section>

      <Footer />
    </main>
  )
}
