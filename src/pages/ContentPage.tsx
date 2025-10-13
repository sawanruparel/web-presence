import { useState, useEffect } from 'react'
import type { ContentItem } from '../utils/content-processor'
import { Footer } from '../components/footer'
import { PageNavigation } from '../components/page-navigation'
import { PasswordModal } from '../components/password-modal'
import { useProtectedContent } from '../hooks/use-protected-content'

interface ContentPageProps {
  content: ContentItem | null
  type: 'notes' | 'publications' | 'ideas'
  slug: string
}

export function ContentPage({ content, type, slug }: ContentPageProps) {
  const [protectedContent, setProtectedContent] = useState<ContentItem | null>(null)
  const [isProtected, setIsProtected] = useState(false)
  
  const { 
    checkAccess, 
    verifyPassword, 
    fetchContent, 
    isModalOpen, 
    closeModal,
    isLoading: hookLoading,
    error: hookError
  } = useProtectedContent()

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'notes': return 'Note'
      case 'publications': return 'Publication'
      case 'ideas': return 'Idea'
      default: return 'Article'
    }
  }

  // Check if this content exists and if it's protected
  useEffect(() => {
    const checkContent = async () => {
      if (!content) {
        // Content not found in public metadata, check if it's protected
        try {
          const hasAccess = await checkAccess(type, slug)
          if (hasAccess) {
            // User has access to protected content, fetch it
            const fetchedContent = await fetchContent(type, slug)
            const contentItem: ContentItem = {
              ...fetchedContent,
              type: fetchedContent.type as 'note' | 'publication' | 'idea' | 'page',
              isProtected: true
            }
            setProtectedContent(contentItem)
            setIsProtected(true)
          } else {
            // Content is protected but user doesn't have access, show modal
            setIsProtected(true)
          }
        } catch (err) {
          // Content might be protected, show modal for password
          setIsProtected(true)
        }
      } else if (content.isProtected) {
        // Content exists but is protected
        setIsProtected(true)
        try {
          const hasAccess = await checkAccess(type, slug)
          if (hasAccess) {
            const fetchedContent = await fetchContent(type, slug)
            const contentItem: ContentItem = {
              ...fetchedContent,
              type: fetchedContent.type as 'note' | 'publication' | 'idea' | 'page',
              isProtected: true
            }
            setProtectedContent(contentItem)
          }
        } catch (err) {
          // Show modal for password
        }
      }
    }
    
    checkContent()
  }, [content, type, slug, checkAccess, fetchContent])

  const handlePasswordSubmit = async (password: string) => {
    try {
      await verifyPassword(type, slug, password)
      // Content will be fetched automatically by the hook
    } catch (err) {
      // Error is handled by the hook
    }
  }

  // Show loading state
  if (hookLoading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 leading-relaxed" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-muted)' }}>Loading content...</p>
        </div>
      </main>
    )
  }

  // Show error state
  if (hookError) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 leading-relaxed" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Access Denied
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {hookError || 'You do not have access to this content.'}
          </p>
        </div>
      </main>
    )
  }

  // Use protected content if available, otherwise use regular content
  const displayContent = protectedContent || content

  // If no content found and not protected, show 404
  if (!displayContent && !isProtected) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 leading-relaxed" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Content Not Found
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            The content you're looking for doesn't exist.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 leading-relaxed" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <header>
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text)' }}>
          {getTypeLabel(type)}s
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-muted)' }}>
          {type === 'notes' && 'Quick thoughts and observations.'}
          {type === 'publications' && 'Books, papers, talks, and other external publications.'}
          {type === 'ideas' && 'Concepts and explorations in technology and design.'}
        </p>
        <PageNavigation currentPage={type} />
      </header>

      <section className="mt-10">
        <h2 className="text-3xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
          {displayContent?.title}
          {isProtected && (
            <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
              🔒 Protected
            </span>
          )}
        </h2>
        
        <div className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
          {displayContent?.date} · {displayContent?.readTime}
        </div>
      </section>

      <article className="prose prose-lg max-w-none" style={{ color: 'var(--color-text)' }}>
        {displayContent?.html ? (
          <div dangerouslySetInnerHTML={{ __html: displayContent.html }} />
        ) : (
          <div className="whitespace-pre-wrap">{displayContent?.content}</div>
        )}
      </article>

      <PasswordModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handlePasswordSubmit}
        title={displayContent?.title || 'Protected Content'}
        isLoading={hookLoading}
        error={hookError || undefined}
      />

      <Footer />
    </main>
  )
}
