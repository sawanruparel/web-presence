import type { ContentItem } from '../utils/content-processor'

interface ContentListRendererProps {
  items: ContentItem[]
  contentType: 'notes' | 'publications' | 'ideas'
  onItemClick?: (item: ContentItem) => void
}

export function ContentListRenderer({ items, contentType, onItemClick }: ContentListRendererProps) {
  const handleContentClick = (e: React.MouseEvent, item: ContentItem) => {
    e.preventDefault()
    
    // Navigate to content (all items in lists are public now)
    if (onItemClick) {
      onItemClick(item)
    } else {
      window.location.href = `/${contentType}/${item.slug}`
    }
  }

  return (
    <>
      <section className="mt-8">
        <ul>
          {items.map((item) => (
            <li
              key={item.slug}
              data-testid="content-card"
              className="border-b py-7"
              style={{ borderColor: 'var(--color-divider)' }}
            >
              <a
                href={`/${contentType}/${item.slug}`}
                className="group block"
                onClick={(e) => handleContentClick(e, item)}
              >
                <h2
                  className="mb-2 transition-colors group-hover:underline"
                  style={{ color: 'var(--color-text)', fontFamily: 'var(--font-sans)', fontSize: '1.2rem', fontWeight: 600 }}
                >
                  {item.title}
                </h2>
                <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', letterSpacing: '0.02em' }}>
                  {item.date} · {item.readTime}
                </p>
                <p className="leading-relaxed" style={{ color: 'var(--color-text-muted)', fontSize: '1.02rem' }}>
                  {item.excerpt}
                </p>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
