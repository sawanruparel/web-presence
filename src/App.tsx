import { ErrorBoundary } from './components/error-boundary.tsx'
import { useState, useEffect } from 'react'
import { getCurrentPage, type PageData } from './utils/router'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { NotesPage } from './pages/NotesPage'
import { TeachingsPage } from './pages/TeachingsPage'
import { IdeasPage } from './pages/IdeasPage'
import { ContentPage } from './pages/ContentPage'

function renderPage(pageData: PageData) {
  switch (pageData.type) {
    case 'about':
      return <AboutPage />
    case 'contact':
      return <ContactPage />
    case 'notes':
      return <NotesPage notes={pageData.data.notes} />
    case 'teachings':
      return <TeachingsPage teachings={pageData.data.teachings} />
    case 'ideas':
      return <IdeasPage ideas={pageData.data.ideas} />
    case 'content':
      return <ContentPage content={pageData.data.content} type={pageData.data.type} />
    default:
      return <AboutPage />
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

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
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
