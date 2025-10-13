import { Footer } from '../components/footer'
import { getPageBySlug } from '../utils/content-processor'

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
      <header>
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text)' }}>{contactContent.title}</h1>
        <p className="mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Get in touch for collaborations, speaking, or just to chat about technology.
        </p>
        <nav className="mt-4 flex gap-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <a href="/" className="hover:underline">About</a>
          <a href="/notes" className="hover:underline">Notes</a>
          <a href="/publications" className="hover:underline">Publications</a>
          <a href="/ideas" className="hover:underline">Ideas</a>
          <a href="/contact" className="hover:underline font-semibold">Contact</a>
        </nav>
      </header>

      <section className="mt-10">
        <div className="prose prose-lg max-w-none" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-serif)', lineHeight: '1.8' }}>
          {contactContent.html ? (
            <div dangerouslySetInnerHTML={{ __html: contactContent.html }} />
          ) : (
            <div className="whitespace-pre-wrap">{contactContent.content}</div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
