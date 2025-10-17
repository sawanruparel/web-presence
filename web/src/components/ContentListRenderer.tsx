import { useState } from 'react'
import type { ContentItem } from '../utils/content-processor'
import { useProtectedContentNavigation } from '../hooks/use-protected-content'
import { AccessModal } from './access-modal'

interface ContentListRendererProps {
  items: ContentItem[]
  contentType: 'notes' | 'publications' | 'ideas'
  onItemClick?: (item: ContentItem) => void
}

export function ContentListRenderer({ items, contentType, onItemClick }: ContentListRendererProps) {
  const [selectedContent, setSelectedContent] = useState<{ type: string, slug: string, title: string } | null>(null)
  const { 
    navigateToProtectedContent, 
    verifyCredentials, 
    isLoading, 
    error, 
    isModalOpen, 
    closeModal,
    accessMode,
    handlePasswordVerified
  } = useProtectedContentNavigation()

  const handleContentClick = async (e: React.MouseEvent, item: ContentItem) => {
    e.preventDefault()
    
    if (item.isProtected) {
      setSelectedContent({ type: contentType, slug: item.slug, title: item.title })
      await navigateToProtectedContent(contentType, item.slug)
    } else {
      // Navigate to regular content
      if (onItemClick) {
        onItemClick(item)
      } else {
        window.location.href = `/${contentType}/${item.slug}`
      }
    }
  }

  const handleCredentialsSubmit = async (credentials: { password?: string; email?: string }) => {
    if (!selectedContent) return
    
    try {
      await verifyCredentials(selectedContent.type as any, selectedContent.slug, credentials)
      // After successful verification, handle navigation
      const navigationSuccess = await handlePasswordVerified()
      if (navigationSuccess) {
        // Add a small delay to ensure session storage is updated
        setTimeout(() => {
          // Navigate to the content page
          if (onItemClick) {
            const item = items.find(i => i.slug === selectedContent.slug)
            if (item) onItemClick(item)
          } else {
            window.location.href = `/${selectedContent.type}/${selectedContent.slug}`
          }
        }, 100)
      }
    } catch (error) {
      // Error is handled by the hook
    }
  }

  return (
    <>
      <section className="mt-10">
        <ul className="space-y-6">
          {items.map((item) => (
            <li key={item.slug} className="border-b pb-6" style={{ borderColor: 'var(--color-divider)' }}>
              <a 
                href={`/${contentType}/${item.slug}`} 
                className="block hover:underline"
                onClick={(e) => handleContentClick(e, item)}
              >
                <h2 className="text-xl font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  {item.title}
                  {item.isProtected && (
                    <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                      🔒 Protected
                    </span>
                  )}
                </h2>
                <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  {item.date} · {item.readTime}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {item.excerpt}
                </p>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <AccessModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleCredentialsSubmit}
        title={selectedContent?.title || 'Protected Content'}
        accessMode={accessMode || 'password'}
        isLoading={isLoading}
        error={error || undefined}
      />
    </>
  )
}
