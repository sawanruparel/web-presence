import { useState } from 'react'
import type { ContentItem } from '../utils/content-processor'
import { Footer } from '../components/footer'
import { PageNavigation } from '../components/page-navigation'
import { PasswordModal } from '../components/password-modal'
import { useProtectedContentNavigation } from '../hooks/use-protected-content'

interface PublicationsPageProps {
  publications: ContentItem[]
}

export function PublicationsPage({ publications }: PublicationsPageProps) {
  const [selectedContent, setSelectedContent] = useState<{ type: 'publications', slug: string, title: string } | null>(null)
  const { 
    navigateToProtectedContent, 
    verifyCredentials, 
    isLoading, 
    error, 
    isModalOpen, 
    closeModal 
  } = useProtectedContentNavigation()

  const handleContentClick = async (e: React.MouseEvent, publication: ContentItem) => {
    e.preventDefault()
    
    if (publication.isProtected) {
      setSelectedContent({ type: 'publications', slug: publication.slug, title: publication.title })
      await navigateToProtectedContent('publications', publication.slug)
    } else {
      // Navigate to regular content
      window.location.href = `/publications/${publication.slug}`
    }
  }

  const handlePasswordSubmit = async (password: string) => {
    if (!selectedContent) return
    
    try {
      await verifyCredentials(selectedContent.type, selectedContent.slug, { password })
      // Navigation will be handled by the hook
    } catch (error) {
      // Error is handled by the hook
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 leading-relaxed" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <header>
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text)' }}>Publications</h1>
        <p className="mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Books, papers, talks, and other external publications.
        </p>
        <PageNavigation currentPage="publications" />
      </header>

      <section className="mt-10">
        <ul className="space-y-6">
          {publications.map((publication) => (
            <li key={publication.slug} className="border-b pb-6" style={{ borderColor: 'var(--color-divider)' }}>
              <a 
                href={`/publications/${publication.slug}`} 
                className="block hover:underline"
                onClick={(e) => handleContentClick(e, publication)}
              >
                <h2 className="text-xl font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  {publication.title}
                  {publication.isProtected && (
                    <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                      🔒 Protected
                    </span>
                  )}
                </h2>
                <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  {publication.date} · {publication.readTime}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {publication.excerpt}
                </p>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <PasswordModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handlePasswordSubmit}
        title={selectedContent?.title || ''}
        isLoading={isLoading}
        error={error || undefined}
      />

      <Footer />
    </main>
  )
}
