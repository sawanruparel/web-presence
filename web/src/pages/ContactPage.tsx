import { Helmet } from 'react-helmet-async'
import { getPageBySlug } from '../utils/content-processor'
import { sanitizeHtml } from '../utils/sanitize-html'
import { PageShell } from '../components/PageShell'

export function ContactPage() {
  const contactContent = getPageBySlug('contact')

  if (!contactContent) {
    return (
      <PageShell currentPage="contact" title="Contact" description="Get in touch for collaborations, speaking, or technical consulting.">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Page not found</h1>
          <p>Sorry, the contact page content could not be loaded.</p>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      currentPage="contact"
      title={contactContent.title}
      description="Get in touch for collaborations, speaking, or just to chat about technology."
    >
      <Helmet>
        <title>Contact — Sawan Ruparel</title>
        <meta name="description" content="Get in touch with Sawan Ruparel for collaborations, speaking, or just to chat about technology." />
        <meta property="og:title" content="Contact — Sawan Ruparel" />
        <meta property="og:url" content="https://sawanruparel.com/contact" />
      </Helmet>
      <section>
        <div className="prose prose-neutral dark:prose-invert max-w-none" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-serif)' }}>
          {contactContent.html ? (
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(contactContent.html) }} />
          ) : (
            <div className="whitespace-pre-wrap">{contactContent.content}</div>
          )}
        </div>
      </section>
    </PageShell>
  )
}
