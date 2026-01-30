import { Footer } from '../components/footer'
import { PageNavigation } from '../components/page-navigation'
import { getPageBySlug } from '../utils/content-processor'

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
      <header>
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text)' }}>{aboutContent.title}</h1>
        <PageNavigation currentPage="about" />
      </header>

      <section className="mt-10">
        <div className="prose prose-lg max-w-none" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-serif)', lineHeight: '1.8' }}>
          {aboutContent.html ? (
            <div dangerouslySetInnerHTML={{ __html: aboutContent.html }} />
          ) : (
            <div className="whitespace-pre-wrap">{aboutContent.content}</div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
