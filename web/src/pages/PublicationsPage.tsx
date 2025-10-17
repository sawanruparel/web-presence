import type { ContentItem } from '../utils/content-processor'
import { ContentPageWrapper } from '../components/ContentPageWrapper'
import { ContentListRenderer } from '../components/ContentListRenderer'

interface PublicationsPageProps {
  publications: ContentItem[]
}

export function PublicationsPage({ publications }: PublicationsPageProps) {
  return (
    <ContentPageWrapper
      currentPage="publications"
      title="Publications"
      description="Books, papers, talks, and other external publications."
    >
      <ContentListRenderer
        items={publications}
        contentType="publications"
      />
    </ContentPageWrapper>
  )
}
