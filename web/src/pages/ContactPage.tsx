import { Helmet } from 'react-helmet-async'
import { Footer } from '../components/footer'
import { PageNavigation } from '../components/page-navigation'
import { getPageBySlug } from '../utils/content-processor'
import { sanitizeHtml } from '../utils/sanitize-html'

export function ContactPage() {
  const contactContent = getPageBySlug('contact')

  if (!contactContent) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 leading-relaxed" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Page not found</h1>
          <p>Sorry, the contact page content could not be loaded.</p>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 leading-relaxed" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <Helmet>
        <title>Contact — Sawan Ruparel</title>
        <meta name="description" content="Get in touch with Sawan Ruparel for collaborations, speaking, or just to chat about technology." />
        <meta property="og:title" content="Contact — Sawan Ruparel" />
        <meta property="og:url" content="https://sawanruparel.com/contact" />
      </Helmet>
      <header>
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text)' }}>{contactContent.title}</h1>
        <PageNavigation currentPage="contact" />
        <p className="mt-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Get in touch for collaborations, speaking, or just to chat about technology.
        </p>
      </header>

      <section className="mt-10">
        <div className="prose prose-lg prose-neutral dark:prose-invert max-w-none" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-serif)', lineHeight: '1.8' }}>
          {contactContent.html ? (
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(contactContent.html) }} />
          ) : (
            <div className="whitespace-pre-wrap">{contactContent.content}</div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
