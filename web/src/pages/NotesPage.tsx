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
      title="The Systems Playbook"
      description="Frameworks, field notes, and long-form essays on applied systems that have to work outside the demo."
    >
      <Helmet>
        <title>The Systems Playbook — Sawan Ruparel</title>
        <meta name="description" content="Frameworks and essays on why applied AI and physical systems succeed or fail in production." />
        <meta property="og:title" content="The Systems Playbook — Sawan Ruparel" />
        <meta property="og:url" content="https://sawanruparel.com/notes" />
      </Helmet>
      <ContentListRenderer
        items={notes}
        contentType="notes"
      />
    </ContentPageWrapper>
  )
}
