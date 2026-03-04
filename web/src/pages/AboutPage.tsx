import { Helmet } from 'react-helmet-async'
import { getPageBySlug } from '../utils/content-processor'
import { sanitizeHtml } from '../utils/sanitize-html'
import { PageShell } from '../components/PageShell'
import { AuthoritySignals } from '../components/AuthoritySignals'

export function AboutPage() {
  const aboutContent = getPageBySlug('about')

  if (!aboutContent) {
    return (
      <PageShell currentPage="about" title="About" description="Applied systems work across AI, healthcare, and physical products.">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Page not found</h1>
          <p>Sorry, the about page content could not be loaded.</p>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      currentPage="about"
      title={aboutContent.title}
      description="Applied systems work where deployment constraints, incentives, and real-world reliability matter."
    >
      <Helmet>
        <title>Sawan Ruparel</title>
        <meta name="description" content={aboutContent.excerpt || 'Personal site of Sawan Ruparel — notes, publications, and ideas.'} />
        <meta property="og:title" content="Sawan Ruparel" />
        <meta property="og:description" content={aboutContent.excerpt || 'Personal site of Sawan Ruparel.'} />
        <meta property="og:url" content="https://sawanruparel.com/" />
      </Helmet>
      <section>
        <div className="prose prose-neutral dark:prose-invert max-w-none" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-serif)' }}>
          {aboutContent.html ? (
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(aboutContent.html) }} />
          ) : (
            <div className="whitespace-pre-wrap">{aboutContent.content}</div>
          )}
        </div>
      </section>
      <AuthoritySignals />
    </PageShell>
  )
}
