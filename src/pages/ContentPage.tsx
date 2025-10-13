import type { ContentItem } from '../utils/content-processor'
import { Footer } from '../components/footer'

interface ContentPageProps {
  content: ContentItem
  type: 'notes' | 'teachings' | 'ideas'
}

export function ContentPage({ content, type }: ContentPageProps) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'notes': return 'Note'
      case 'teachings': return 'Teaching'
      case 'ideas': return 'Idea'
      default: return 'Article'
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 leading-relaxed" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <header>
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text)' }}>
          {getTypeLabel(type)}s
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-muted)' }}>
          {type === 'notes' && 'Quick thoughts and observations.'}
          {type === 'teachings' && 'Educational content and tutorials.'}
          {type === 'ideas' && 'Concepts and explorations in technology and design.'}
        </p>
        <nav className="mt-4 flex gap-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <a href="/" className="hover:underline">About</a>
          <a href="/notes" className="hover:underline">Notes</a>
          <a href="/teachings" className="hover:underline">Teachings</a>
          <a href="/ideas" className="hover:underline">Ideas</a>
          <a href="/contact" className="hover:underline">Contact</a>
        </nav>
      </header>

      <section className="mt-10">
        <h2 className="text-3xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
          {content.title}
        </h2>
        
        <div className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
          {content.date} · {content.readTime}
        </div>
      </section>

      <article className="prose prose-lg max-w-none" style={{ color: 'var(--color-text)' }}>
        {content.html ? (
          <div dangerouslySetInnerHTML={{ __html: content.html }} />
        ) : (
          <div className="whitespace-pre-wrap">{content.content}</div>
        )}
      </article>

      <Footer />
    </main>
  )
}
