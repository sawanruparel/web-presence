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
      <ContentListRenderer
        items={notes}
        contentType="notes"
      />
    </ContentPageWrapper>
  )
}
