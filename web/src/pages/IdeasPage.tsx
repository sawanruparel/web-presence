import type { ContentItem } from '../utils/content-processor'
import { ContentPageWrapper } from '../components/ContentPageWrapper'
import { ContentListRenderer } from '../components/ContentListRenderer'

interface IdeasPageProps {
  ideas: ContentItem[]
}

export function IdeasPage({ ideas }: IdeasPageProps) {
  return (
    <ContentPageWrapper
      currentPage="ideas"
      title="Ideas"
      description="Concepts and explorations in technology and design."
    >
      <ContentListRenderer
        items={ideas}
        contentType="ideas"
      />
    </ContentPageWrapper>
  )
}
