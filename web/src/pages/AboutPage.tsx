import { Helmet } from 'react-helmet-async'
import { Footer } from '../components/footer'
import { PageNavigation } from '../components/page-navigation'
import { getPageBySlug } from '../utils/content-processor'
import { sanitizeHtml } from '../utils/sanitize-html'

export function AboutPage() {
  const aboutContent = getPageBySlug('about')

  if (!aboutContent) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 leading-relaxed" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Page not found</h1>
          <p>Sorry, the about page content could not be loaded.</p>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 leading-relaxed" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <Helmet>
        <title>Sawan Ruparel</title>
        <meta name="description" content={aboutContent.excerpt || 'Personal site of Sawan Ruparel — notes, publications, and ideas.'} />
        <meta property="og:title" content="Sawan Ruparel" />
        <meta property="og:description" content={aboutContent.excerpt || 'Personal site of Sawan Ruparel.'} />
        <meta property="og:url" content="https://sawanruparel.com/" />
      </Helmet>
      <header>
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text)' }}>{aboutContent.title}</h1>
        <PageNavigation currentPage="about" />
      </header>

      <section className="mt-10">
        <div className="prose prose-lg prose-neutral dark:prose-invert max-w-none" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-serif)', lineHeight: '1.8' }}>
          {aboutContent.html ? (
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(aboutContent.html) }} />
          ) : (
            <div className="whitespace-pre-wrap">{aboutContent.content}</div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
