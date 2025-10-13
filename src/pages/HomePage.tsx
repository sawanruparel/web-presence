import type { ContentItem } from '../utils/content-processor'
import { Footer } from '../components/footer'

interface HomePageProps {
  entries: ContentItem[]
}

export function HomePage({ entries }: HomePageProps) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 leading-relaxed" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <header>
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text)' }}>Sawan Ruparel</h1>
        <p className="mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Founder at Quoppo. Building ventures at the intersection of AI and hardware.
          Teaching applications of generative AI at the University of Connecticut.
        </p>
        <nav className="mt-4 flex gap-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <a href="#about" className="hover:underline">About</a>
          <a href="/notes" className="hover:underline">Notes</a>
          <a href="/publications" className="hover:underline">Publications</a>
          <a href="/ideas" className="hover:underline">Ideas</a>
          <a href="/contact" className="hover:underline">Contact</a>
        </nav>
      </header>

      <section id="about" className="mt-10">
        <p style={{ color: 'var(--color-text)' }}>
          I explore how humans build, make, and teach through systems—both physical and digital.
          My work blends hardware engineering, AI systems design, and education.
        </p>
      </section>

      <hr className="my-10" style={{ borderColor: 'var(--color-divider)' }} />

      <section id="latest">
        <h2 className="text-lg font-medium" style={{ color: 'var(--color-text-muted)' }}>Latest</h2>
        <ul className="mt-4 space-y-3">
          {entries.map((entry) => (
            <li key={entry.slug}>
              <a href={`/${entry.type}s/${entry.slug}`} className="block hover:underline" style={{ color: 'var(--color-text)' }}>
                {entry.title}
              </a>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {entry.date} · {entry.readTime}
              </p>
            </li>
          ))}
        </ul>
        <a href="/notes" className="mt-6 inline-block text-sm hover:underline" style={{ color: 'var(--color-text-muted)' }}>
          See all →
        </a>
      </section>

      <Footer />
    </main>
  )
}
