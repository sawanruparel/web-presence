import { useState, useEffect } from 'react'
import type { ContentItem } from '../utils/content-processor'
import { useProtectedContent } from '../hooks/use-protected-content'
import { AccessModal } from './access-modal'

interface ContentRendererProps {
  content: ContentItem | null
  contentType: 'notes' | 'publications' | 'ideas'
  slug: string
  showHeader?: boolean
  showNavigation?: boolean
}

export function ContentRenderer({ 
  content, 
  contentType, 
  slug, 
  showHeader = true, 
  showNavigation: _showNavigation = true 
}: ContentRendererProps) {
  const [isProtected, setIsProtected] = useState(false)
  
  const { 
    checkAccess, 
    verifyCredentials, 
    fetchContent, 
    isModalOpen, 
    closeModal,
    accessMode,
    isLoading: hookLoading,
    error: hookError,
    content: hookContent
  } = useProtectedContent()

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'notes': return 'Note'
      case 'publications': return 'Publication'
      case 'ideas': return 'Idea'
      default: return 'Article'
    }
  }

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'notes': return 'Quick thoughts and observations.'
      case 'publications': return 'Books, papers, talks, and other external publications.'
      case 'ideas': return 'Concepts and explorations in technology and design.'
      default: return ''
    }
  }

  // Check if this content exists and if it's protected
  useEffect(() => {
    const checkContent = async () => {
      console.log('🔍 ContentRenderer: Checking content for', contentType, slug, 'content:', !!content)
      if (!content) {
        console.log('📄 Content not found in public metadata, checking if protected')
        // Content not found in public metadata, check if it's protected
        try {
          const hasAccess = await checkAccess(contentType, slug)
          console.log('🔐 ContentRenderer: hasAccess =', hasAccess)
          if (hasAccess) {
            // User has access to protected content, fetch it
            await fetchContent(contentType, slug)
            setIsProtected(true)
          } else {
            // Content is protected but user doesn't have access, modal should be open
            console.log('🔐 ContentRenderer: Content is protected, setting isProtected = true')
            setIsProtected(true)
          }
        } catch (err) {
          console.error('❌ ContentRenderer: Error checking access:', err)
          // Check if it's a 404 error (content doesn't exist)
          if (err instanceof Error && err.message.includes('404')) {
            console.log('📄 ContentRenderer: Content not found (404)')
            setIsProtected(false) // Don't show modal for non-existent content
            return
          }
          // Other errors might indicate protected content, show modal
          console.log('🔐 ContentRenderer: Error occurred, assuming protected and setting isProtected = true')
          setIsProtected(true)
        }
      } else if (content.isProtected) {
        console.log('🔐 ContentRenderer: Content exists but is protected')
        // Content exists but is protected
        setIsProtected(true)
        try {
          const hasAccess = await checkAccess(contentType, slug)
          if (hasAccess) {
            await fetchContent(contentType, slug)
            // Content fetched successfully, hook will handle state
          }
        } catch (err) {
          console.error('Error checking access for existing protected content:', err)
          // Show modal for password
        }
      }
    }
    
    checkContent()
  }, [content, contentType, slug, checkAccess, fetchContent])

  const handleCredentialsSubmit = async (credentials: { password?: string; email?: string }) => {
    try {
      await verifyCredentials(contentType, slug, credentials)
      // Content will be fetched automatically by the hook
    } catch (err) {
      // Error is handled by the hook
    }
  }

  // Debug logging
  console.log('🔍 ContentRenderer render state:', {
    content: !!content,
    protectedContent: !!hookContent,
    isProtected,
    isModalOpen,
    accessMode,
    hookError,
    hookLoading
  })

  // Show loading state
  if (hookLoading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading content...</p>
      </div>
    )
  }

  // Show error state
  if (hookError) {
    const isNotFound = hookError.includes('not found') || hookError.includes('404')
    return (
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
          {isNotFound ? 'Content Not Found' : 'Access Denied'}
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          {isNotFound 
            ? 'The content you\'re looking for doesn\'t exist.'
            : hookError || 'You do not have access to this content.'
          }
        </p>
      </div>
    )
  }

  // Use protected content if available, otherwise use regular content
  const displayContent = hookContent || content

  // If no content found and not protected, show 404
  if (!displayContent && !isProtected) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
          Content Not Found
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          The content you're looking for doesn't exist.
        </p>
      </div>
    )
  }

  return (
    <>
      {showHeader && (
        <header>
          <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text)' }}>
            {getTypeLabel(contentType)}s
          </h1>
          <p className="mt-2" style={{ color: 'var(--color-text-muted)' }}>
            {getTypeDescription(contentType)}
          </p>
        </header>
      )}

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

      <AccessModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleCredentialsSubmit}
        title={displayContent?.title || 'Protected Content'}
        accessMode={accessMode || 'password'}
        isLoading={hookLoading}
        error={hookError || undefined}
      />
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ position: 'fixed', top: 0, right: 0, background: 'black', color: 'white', padding: '10px', fontSize: '12px', zIndex: 9999 }}>
          Debug: accessMode={accessMode}, isModalOpen={isModalOpen}, hookError={hookError}
        </div>
      )}
    </>
  )
}
