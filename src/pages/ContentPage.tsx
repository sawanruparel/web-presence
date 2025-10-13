import type { ContentItem } from '../utils/content-processor'

interface ContentPageProps {
  content: ContentItem
  type: 'notes' | 'teachings' | 'ideas'
}

export function ContentPage({ content, type }: ContentPageProps) {
  const typeLabels = {
    notes: 'Note',
    teachings: 'Teaching',
    ideas: 'Idea'
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 leading-relaxed" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <header>
        <nav className="mb-8 flex gap-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <a href="/" className="hover:underline">About</a>
          <a href="/notes" className="hover:underline">Notes</a>
          <a href="/teachings" className="hover:underline">Teachings</a>
          <a href="/ideas" className="hover:underline">Ideas</a>
          <a href="/contact" className="hover:underline">Contact</a>
        </nav>
        
        <div className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
          {typeLabels[type]} · {content.date} · {content.readTime} read
        </div>
        
        <h1 className="text-3xl font-semibold mb-8" style={{ color: 'var(--color-text)' }}>
          {content.title}
        </h1>
      </header>

      <article 
        className="prose prose-lg max-w-none"
        style={{ 
          color: 'var(--color-text)',
          fontFamily: 'var(--font-serif)',
          lineHeight: '1.8'
        }}
        dangerouslySetInnerHTML={{ __html: content.html }}
      />

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
