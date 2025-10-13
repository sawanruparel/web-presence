import type { ContentItem } from '../utils/content-processor'

interface IdeasPageProps {
  ideas: ContentItem[]
}

export function IdeasPage({ ideas }: IdeasPageProps) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 leading-relaxed" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <header>
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text)' }}>Ideas</h1>
        <p className="mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Concepts and explorations in technology and design.
        </p>
        <nav className="mt-4 flex gap-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <a href="/" className="hover:underline">About</a>
          <a href="/notes" className="hover:underline">Notes</a>
          <a href="/teachings" className="hover:underline">Teachings</a>
          <a href="/ideas" className="hover:underline font-semibold">Ideas</a>
          <a href="/contact" className="hover:underline">Contact</a>
        </nav>
      </header>

      <section className="mt-10">
        <ul className="space-y-6">
          {ideas.map((idea) => (
            <li key={idea.slug} className="border-b pb-6" style={{ borderColor: 'var(--color-divider)' }}>
              <a href={`/ideas/${idea.slug}`} className="block hover:underline">
                <h2 className="text-xl font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  {idea.title}
                </h2>
                <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  {idea.date} · {idea.readTime}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {idea.excerpt}
                </p>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-12 text-sm flex justify-between items-center" style={{ color: 'var(--color-text-muted)' }}>
        <span>© 2025 · built by hand.</span>
        <div className="flex gap-4">
          <a href="/rss" className="hover:underline">RSS</a>
          <a href="/resume" className="hover:underline">Resume</a>
          <a href="https://linkedin.com/in/sawanruparel" className="hover:underline" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </div>
      </footer>
    </main>
  )
}
