import { Helmet } from 'react-helmet-async'
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
      <Helmet>
        <title>Publications — Sawan Ruparel</title>
        <meta name="description" content="Books, papers, talks, and other external publications by Sawan Ruparel." />
        <meta property="og:title" content="Publications — Sawan Ruparel" />
        <meta property="og:url" content="https://sawanruparel.com/publications" />
      </Helmet>
      <ContentListRenderer
        items={publications}
        contentType="publications"
      />
    </ContentPageWrapper>
  )
}
