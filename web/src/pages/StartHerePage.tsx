import { Helmet } from 'react-helmet-async'
import { getPageBySlug } from '../utils/content-processor'
import { sanitizeHtml } from '../utils/sanitize-html'
import { PageShell } from '../components/PageShell'

export function StartHerePage() {
  const startHereContent = getPageBySlug('start-here')

  if (!startHereContent) {
    return (
      <PageShell currentPage="start-here" title="Start Here" description="A curated reading path for first-time visitors.">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Page not found</h2>
          <p>Sorry, the start here page content could not be loaded.</p>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      currentPage="start-here"
      title={startHereContent.title}
      description="If you are exploring why GenAI systems fail in the real world, begin with these pieces."
    >
      <Helmet>
        <title>Start Here — Sawan Ruparel</title>
        <meta
          name="description"
          content={startHereContent.excerpt || 'A curated path through core essays on applied AI systems and deployment realities.'}
        />
        <meta property="og:title" content="Start Here — Sawan Ruparel" />
        <meta
          property="og:description"
          content={startHereContent.excerpt || 'A guided reading path through frameworks for applied systems work.'}
        />
        <meta property="og:url" content="https://sawanruparel.com/start-here" />
      </Helmet>

      <div className="prose prose-neutral dark:prose-invert max-w-none" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-serif)' }}>
        {startHereContent.html ? (
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(startHereContent.html) }} />
        ) : (
          <div className="whitespace-pre-wrap">{startHereContent.content}</div>
        )}
      </div>
    </PageShell>
  )
}
