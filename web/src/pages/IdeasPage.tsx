import { Helmet } from 'react-helmet-async'
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
      <Helmet>
        <title>Ideas — Sawan Ruparel</title>
        <meta name="description" content="Concepts and explorations in technology and design by Sawan Ruparel." />
        <meta property="og:title" content="Ideas — Sawan Ruparel" />
        <meta property="og:url" content="https://sawanruparel.com/ideas" />
      </Helmet>
      <ContentListRenderer
        items={ideas}
        contentType="ideas"
      />
    </ContentPageWrapper>
  )
}
