import { Helmet } from 'react-helmet-async'
import type { ContentItem } from '../utils/content-processor'
import { ContentPageWrapper } from '../components/ContentPageWrapper'
import { ContentRenderer } from '../components/ContentRenderer'

interface ContentPageProps {
  content: ContentItem | null
  type: 'notes' | 'publications' | 'ideas'
  slug: string
}

export function ContentPage({ content, type, slug }: ContentPageProps) {
  const getSectionTitle = (sectionType: ContentPageProps['type']) => {
    switch (sectionType) {
      case 'notes':
        return 'The Systems Playbook'
      case 'publications':
        return 'Publications'
      case 'ideas':
      default:
        return 'Ideas'
    }
  }

  const getSectionDescription = (sectionType: ContentPageProps['type']) => {
    switch (sectionType) {
      case 'notes':
        return 'Frameworks and essays on deployed systems where constraints are real.'
      case 'publications':
        return 'Books, papers, talks, and other external publications.'
      case 'ideas':
      default:
        return 'Concepts and explorations in technology and design.'
    }
  }

  const pageTitle = content?.title
    ? `${content.title} — Sawan Ruparel`
    : `${getSectionTitle(type)} — Sawan Ruparel`
  const pageDescription = content?.excerpt || ''
  const pageUrl = `https://sawanruparel.com/${type}/${slug}`

  return (
    <ContentPageWrapper
      currentPage={type}
      title={getSectionTitle(type)}
      description={getSectionDescription(type)}
    >
      <Helmet>
        <title>{pageTitle}</title>
        {pageDescription && <meta name="description" content={pageDescription} />}
        <meta property="og:title" content={pageTitle} />
        {pageDescription && <meta property="og:description" content={pageDescription} />}
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="article" />
        {content?.date && <meta property="article:published_time" content={content.date} />}
      </Helmet>
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
