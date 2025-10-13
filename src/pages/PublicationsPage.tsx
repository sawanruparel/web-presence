import type { ContentItem } from '../utils/content-processor'
import { Footer } from '../components/footer'
import { PageNavigation } from '../components/page-navigation'

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
        <PageNavigation currentPage="publications" />
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
