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
              className="border-b py-6"
              style={{ borderColor: 'var(--color-divider)' }}
            >
              <a
                href={`/${contentType}/${item.slug}`}
                className="group block"
                onClick={(e) => handleContentClick(e, item)}
              >
                <h2
                  className="text-lg font-medium mb-1 transition-colors group-hover:underline"
                  style={{ color: 'var(--color-text)' }}
                >
                  {item.title}
                </h2>
                <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  {item.date} · {item.readTime}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
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
