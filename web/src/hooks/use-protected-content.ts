import { useState, useCallback } from 'react'
import { apiClient, type ProtectedContentResponse, type AccessMode } from '../utils/api-client'
import { 
  isContentVerified, 
  getContentToken, 
  storeContentVerification 
} from '../utils/session-manager'

export interface UseProtectedContentState {
  isLoading: boolean
  error: string | null
  isModalOpen: boolean
  content: ProtectedContentResponse | null
  accessMode: AccessMode | null
  description: string | null
}

export interface UseProtectedContentActions {
  checkAccess: (type: 'notes' | 'publications' | 'ideas' | 'pages', slug: string) => Promise<boolean>
  verifyCredentials: (type: 'notes' | 'publications' | 'ideas' | 'pages', slug: string, credentials: { password?: string; email?: string }) => Promise<void>
  fetchContent: (type: 'notes' | 'publications' | 'ideas' | 'pages', slug: string) => Promise<ProtectedContentResponse>
  openModal: () => void
  closeModal: () => void
  clearError: () => void
}

export function useProtectedContent(): UseProtectedContentState & UseProtectedContentActions {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [content, setContent] = useState<ProtectedContentResponse | null>(null)
  const [accessMode, setAccessMode] = useState<AccessMode | null>(null)
  const [description, setDescription] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const openModal = useCallback(() => {
    setIsModalOpen(true)
    clearError()
  }, [clearError])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    clearError()
  }, [clearError])

  const checkAccess = useCallback(async (
    type: 'notes' | 'publications' | 'ideas' | 'pages', 
    slug: string
  ): Promise<boolean> => {
    try {
      // Check if content is already verified
      if (isContentVerified(type, slug)) {
        return true
      }

      // Call backend to check access requirements
      const accessInfo = await apiClient.checkAccess(type, slug)
      setAccessMode(accessInfo.accessMode)
      setDescription(accessInfo.message)

      // If open access, proceed without modal
      if (accessInfo.accessMode === 'open') {
        // For open content, generate a token anyway
        const response = await apiClient.verifyPassword({
          type,
          slug
        })
        
        if (response.success && response.token) {
          storeContentVerification(type, slug, response.token)
          return true
        }
      }

      // Otherwise, open modal for password/email input
      openModal()
      return false
    } catch (err) {
      console.error('Failed to check access:', err)
      setError('Failed to check content access')
      return false
    }
  }, [openModal])

  const verifyCredentials = useCallback(async (
    type: 'notes' | 'publications' | 'ideas' | 'pages',
    slug: string,
    credentials: { password?: string; email?: string }
  ): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      // Call API to verify credentials (password or email)
      const response = await apiClient.verifyPassword({
        type,
        slug,
        ...credentials
      })

      if (response.success && response.token) {
        // Store the verification token
        storeContentVerification(type, slug, response.token)
        
        // Close modal
        closeModal()
        
        // Fetch the content
        await fetchContent(type, slug)
      } else {
        throw new Error(response.message || 'Verification failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [closeModal])

  const fetchContent = useCallback(async (
    type: 'notes' | 'publications' | 'ideas' | 'pages',
    slug: string
  ): Promise<ProtectedContentResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      // Get the stored token
      const token = getContentToken(type, slug)
      if (!token) {
        throw new Error('No authentication token found. Please verify password again.')
      }

      // Fetch the protected content
      const contentData = await apiClient.getProtectedContent(type, slug, token)
      
      setContent(contentData)
      return contentData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch protected content'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    // State
    isLoading,
    error,
    isModalOpen,
    content,
    accessMode,
    description,
    
    // Actions
    checkAccess,
    verifyCredentials,
    fetchContent,
    openModal,
    closeModal,
    clearError
  }
}

/**
 * Hook for handling protected content navigation
 * This is a convenience hook that combines the main hook with navigation logic
 */
export function useProtectedContentNavigation() {
  const protectedContent = useProtectedContent()
  const [pendingNavigation, setPendingNavigation] = useState<{
    type: 'notes' | 'publications' | 'ideas' | 'pages'
    slug: string
  } | null>(null)

  const navigateToProtectedContent = useCallback(async (
    type: 'notes' | 'publications' | 'ideas' | 'pages',
    slug: string
  ) => {
    try {
      const hasAccess = await protectedContent.checkAccess(type, slug)
      
      if (hasAccess) {
        // User already has access, fetch content and navigate
        await protectedContent.fetchContent(type, slug)
        // Navigation will be handled by the parent component
        return true
      } else {
        // Store pending navigation for after password verification
        setPendingNavigation({ type, slug })
        return false
      }
    } catch (err) {
      console.error('Navigation to protected content failed:', err)
      return false
    }
  }, [protectedContent])

  const handlePasswordVerified = useCallback(async () => {
    if (pendingNavigation) {
      try {
        await protectedContent.fetchContent(pendingNavigation.type, pendingNavigation.slug)
        setPendingNavigation(null)
        return true
      } catch (err) {
        console.error('Failed to fetch content after password verification:', err)
        return false
      }
    }
    return false
  }, [protectedContent, pendingNavigation])

  return {
    ...protectedContent,
    navigateToProtectedContent,
    handlePasswordVerified,
    pendingNavigation
  }
}
