import type { ReactNode } from 'react'
import { PageShell } from './PageShell'

interface ContentPageWrapperProps {
  children: ReactNode
  currentPage: 'notes' | 'publications' | 'ideas' | 'pages' | 'start-here' | 'about' | 'contact'
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
    <PageShell currentPage={currentPage} title={title} description={description}>
      {children}
    </PageShell>
  )
}
