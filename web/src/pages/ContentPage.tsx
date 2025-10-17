import type { ContentItem } from '../utils/content-processor'
import { ContentPageWrapper } from '../components/ContentPageWrapper'
import { ContentRenderer } from '../components/ContentRenderer'

interface ContentPageProps {
  content: ContentItem | null
  type: 'notes' | 'publications' | 'ideas'
  slug: string
}

export function ContentPage({ content, type, slug }: ContentPageProps) {
  return (
    <ContentPageWrapper
      currentPage={type}
      title={`${type.charAt(0).toUpperCase() + type.slice(1)}`}
      description={
        type === 'notes' ? 'Quick thoughts and observations.' :
        type === 'publications' ? 'Books, papers, talks, and other external publications.' :
        'Concepts and explorations in technology and design.'
      }
    >
      <ContentRenderer
        content={content}
        contentType={type}
        slug={slug}
        showHeader={false}
        showNavigation={false}
      />
    </ContentPageWrapper>
  )
}
