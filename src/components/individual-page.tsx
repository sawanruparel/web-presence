interface IndividualPageProps {
  type: 'note' | 'teaching' | 'idea'
  date: string
  readTime: string
  title: string
  content: string
  previousEntry?: {
    title: string
    url: string
  }
  nextEntry?: {
    title: string
    url: string
  }
}

export function IndividualPage({
  type,
  date,
  readTime,
  title,
  content,
  previousEntry,
  nextEntry
}: IndividualPageProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="content-container pt-20 pb-16">
        {/* Meta line */}
        <div className="page-meta">
          {type} · {date} · {readTime} read
        </div>

        {/* Title */}
        <h1 className="page-title">{title}</h1>

        {/* Content */}
        <div className="page-content">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>

        {/* Navigation */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              {previousEntry && (
                <a href={previousEntry.url} className="nav-arrow">
                  ← Back to all
                </a>
              )}
            </div>
            <div>
              {nextEntry && (
                <a href={nextEntry.url} className="nav-arrow">
                  Next: {nextEntry.title} →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
