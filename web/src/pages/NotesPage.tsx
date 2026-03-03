import { Helmet } from 'react-helmet-async'
import type { ContentItem } from '../utils/content-processor'
import { ContentPageWrapper } from '../components/ContentPageWrapper'
import { ContentListRenderer } from '../components/ContentListRenderer'

interface NotesPageProps {
  notes: ContentItem[]
}

export function NotesPage({ notes }: NotesPageProps) {
  return (
    <ContentPageWrapper
      currentPage="notes"
      title="Notes"
      description="Thoughts and observations on building and making."
    >
      <Helmet>
        <title>Notes — Sawan Ruparel</title>
        <meta name="description" content="Quick thoughts and observations on technology, building, and making." />
        <meta property="og:title" content="Notes — Sawan Ruparel" />
        <meta property="og:url" content="https://sawanruparel.com/notes" />
      </Helmet>
      <ContentListRenderer
        items={notes}
        contentType="notes"
      />
    </ContentPageWrapper>
  )
}
