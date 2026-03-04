import type { ReactNode } from 'react'
import { Footer } from './footer'
import { PageNavigation } from './page-navigation'

interface PageShellProps {
  children: ReactNode
  currentPage?: string
  title: string
  description?: string
  preface?: ReactNode
}

export function PageShell({ children, currentPage, title, description, preface }: PageShellProps) {
  return (
    <main className="site-shell" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <header className="site-header">
        <div className="site-header-meta">Sawan Ruparel</div>
        <h1 className="site-title">{title}</h1>
        <PageNavigation currentPage={currentPage} />
        {description && <p className="site-description">{description}</p>}
        {preface}
      </header>

      <section className="site-content">
        {children}
      </section>

      <Footer />
    </main>
  )
}
