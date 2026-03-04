import { ErrorBoundary } from './components/error-boundary.tsx'
import { useState, useEffect } from 'react'
import { getCurrentPage, navigateTo, type PageData } from './utils/router'
import { AboutPage } from './pages/AboutPage'
import { StartHerePage } from './pages/StartHerePage'
import { ContactPage } from './pages/ContactPage'
import { NotesPage } from './pages/NotesPage'
import { PublicationsPage } from './pages/PublicationsPage'
import { IdeasPage } from './pages/IdeasPage'
import { ContentPage } from './pages/ContentPage'
import { AdminContentPage } from './pages/AdminContentPage'
import { AdminBuildLogsPage } from './pages/AdminBuildLogsPage'
import { AdminContentSyncPage } from './pages/AdminContentSyncPage'
import { NotFoundPage } from './pages/NotFoundPage'

function renderPage(pageData: PageData) {
  switch (pageData.type) {
    case 'about':
      return <AboutPage />
    case 'start-here':
      return <StartHerePage />
    case 'contact':
      return <ContactPage />
    case 'notes':
      return <NotesPage notes={pageData.data.notes} />
    case 'publications':
      return <PublicationsPage publications={pageData.data.publications} />
    case 'ideas':
      return <IdeasPage ideas={pageData.data.ideas} />
    case 'content':
      return <ContentPage content={pageData.data.content} type={pageData.data.type} slug={pageData.data.slug} />
    case 'admin-content':
      return <AdminContentPage />
    case 'admin-build-logs':
      return <AdminBuildLogsPage />
    case 'admin-content-sync':
      return <AdminContentSyncPage />
    case '404':
      return <NotFoundPage />
    default:
      return <NotFoundPage />
  }
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadPage = () => {
    setLoading(true)
    try {
      const pageData = getCurrentPage()
      setCurrentPage(pageData)
    } catch (error) {
      console.error('Error loading page:', error)
      setCurrentPage({ type: 'about', data: {} })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPage()

    const handlePopState = () => {
      loadPage()
    }

    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }

      const target = event.target as HTMLElement | null
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null

      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) {
        return
      }

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return
      }

      const url = new URL(anchor.href, window.location.origin)
      if (url.origin !== window.location.origin) {
        return
      }

      event.preventDefault()
      navigateTo(`${url.pathname}${url.search}${url.hash}`)
    }

    window.addEventListener('popstate', handlePopState)
    document.addEventListener('click', handleDocumentClick)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      document.removeEventListener('click', handleDocumentClick)
    }
  }, [])

  if (loading || !currentPage) {
    return (
      <ErrorBoundary context="App">
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
          <div style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary context="App">
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
        {renderPage(currentPage)}
      </div>
    </ErrorBoundary>
  )
}
