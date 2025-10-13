import type { ContentItem } from '../utils/content-processor'
import { Footer } from '../components/footer'

interface PublicationsPageProps {
  publications: ContentItem[]
}

export function PublicationsPage({ publications }: PublicationsPageProps) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 leading-relaxed" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <header>
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text)' }}>Publications</h1>
        <p className="mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Books, papers, talks, and other external publications.
        </p>
        <nav className="mt-4 flex gap-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <a href="/" className="hover:underline">About</a>
          <a href="/notes" className="hover:underline">Notes</a>
          <a href="/publications" className="hover:underline font-semibold">Publications</a>
          <a href="/ideas" className="hover:underline">Ideas</a>
          <a href="/contact" className="hover:underline">Contact</a>
        </nav>
      </header>

      <section className="mt-10">
        <ul className="space-y-6">
          {publications.map((publication) => (
            <li key={publication.slug} className="border-b pb-6" style={{ borderColor: 'var(--color-divider)' }}>
              <a href={`/publications/${publication.slug}`} className="block hover:underline">
                <h2 className="text-xl font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  {publication.title}
                </h2>
                <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  {publication.date} · {publication.readTime}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {publication.excerpt}
                </p>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <Footer />
    </main>
  )
}
