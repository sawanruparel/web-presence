import type { ContentItem } from '../utils/content-processor'
import { Footer } from '../components/footer'
import { PageNavigation } from '../components/page-navigation'

interface NotesPageProps {
  notes: ContentItem[]
}

export function NotesPage({ notes }: NotesPageProps) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 leading-relaxed" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <header>
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text)' }}>Notes</h1>
        <p className="mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Thoughts and observations on building and making.
        </p>
        <PageNavigation currentPage="notes" />
      </header>

      <section className="mt-10">
        <ul className="space-y-6">
          {notes.map((note) => (
            <li key={note.slug} className="border-b pb-6" style={{ borderColor: 'var(--color-divider)' }}>
              <a href={`/notes/${note.slug}`} className="block hover:underline">
                <h2 className="text-xl font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  {note.title}
                </h2>
                <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  {note.date} · {note.readTime}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {note.excerpt}
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
