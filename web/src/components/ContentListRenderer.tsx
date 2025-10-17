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
      <section className="mt-10">
        <ul className="space-y-6">
          {items.map((item) => (
            <li key={item.slug} className="border-b pb-6" style={{ borderColor: 'var(--color-divider)' }}>
              <a 
                href={`/${contentType}/${item.slug}`} 
                className="block hover:underline"
                onClick={(e) => handleContentClick(e, item)}
              >
                <h2 className="text-xl font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  {item.title}
                </h2>
                <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  {item.date} · {item.readTime}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
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
