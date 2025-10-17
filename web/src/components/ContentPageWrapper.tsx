import type { ReactNode } from 'react'
import { Footer } from './footer'
import { PageNavigation } from './page-navigation'

interface ContentPageWrapperProps {
  children: ReactNode
  currentPage: 'notes' | 'publications' | 'ideas' | 'pages'
  title: string
  description: string
}

export function ContentPageWrapper({ 
  children, 
  currentPage, 
  title, 
  description 
}: ContentPageWrapperProps) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 leading-relaxed" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <header>
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text)' }}>
          {title}
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-muted)' }}>
          {description}
        </p>
        <PageNavigation currentPage={currentPage} />
      </header>

      {children}

      <Footer />
    </main>
  )
}
