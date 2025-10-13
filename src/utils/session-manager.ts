/**
 * Session Manager for Password Protected Content
 * 
 * Manages authentication tokens and verified content access in sessionStorage.
 * Tokens are stored per content item and expire with the browser session.
 */

export interface VerifiedContent {
  type: 'notes' | 'publications' | 'ideas' | 'pages'
  slug: string
  token: string
  timestamp: number
}

export interface ProtectedContentData {
  slug: string
  title: string
  date: string
  readTime: string
  type: string
  excerpt: string
  content: string
  html: string
}

const STORAGE_KEY = 'verified_content'
const TOKEN_EXPIRY_HOURS = 24

/**
 * Get all verified content from sessionStorage
 */
export function getVerifiedContent(): VerifiedContent[] {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const verified = JSON.parse(stored) as VerifiedContent[]
    
    // Filter out expired tokens
    const now = Date.now()
    const validVerified = verified.filter(item => {
      const ageHours = (now - item.timestamp) / (1000 * 60 * 60)
      return ageHours < TOKEN_EXPIRY_HOURS
    })
    
    // Update storage if we filtered out expired items
    if (validVerified.length !== verified.length) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(validVerified))
    }
    
    return validVerified
  } catch (error) {
    console.warn('Failed to load verified content from sessionStorage:', error)
    return []
  }
}

/**
 * Check if a specific content item is verified
 */
export function isContentVerified(type: 'notes' | 'publications' | 'ideas' | 'pages', slug: string): boolean {
  const verified = getVerifiedContent()
  return verified.some(item => item.type === type && item.slug === slug)
}

/**
 * Get token for a specific content item
 */
export function getContentToken(type: 'notes' | 'publications' | 'ideas' | 'pages', slug: string): string | null {
  const verified = getVerifiedContent()
  const item = verified.find(item => item.type === type && item.slug === slug)
  return item?.token || null
}

/**
 * Store verification token for a content item
 */
export function storeContentVerification(
  type: 'notes' | 'publications' | 'ideas' | 'pages', 
  slug: string, 
  token: string
): void {
  try {
    const verified = getVerifiedContent()
    
    // Remove existing entry for this content item
    const filtered = verified.filter(item => !(item.type === type && item.slug === slug))
    
    // Add new entry
    const newEntry: VerifiedContent = {
      type,
      slug,
      token,
      timestamp: Date.now()
    }
    
    filtered.push(newEntry)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to store content verification:', error)
  }
}

/**
 * Remove verification for a specific content item
 */
export function removeContentVerification(type: 'notes' | 'publications' | 'ideas' | 'pages', slug: string): void {
  try {
    const verified = getVerifiedContent()
    const filtered = verified.filter(item => !(item.type === type && item.slug === slug))
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to remove content verification:', error)
  }
}

/**
 * Clear all verified content (useful for logout)
 */
export function clearAllVerifications(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear all verifications:', error)
  }
}

/**
 * Get all verified content items as a summary
 */
export function getVerifiedContentSummary(): Array<{ type: string; slug: string; title?: string }> {
  const verified = getVerifiedContent()
  return verified.map(item => ({
    type: item.type,
    slug: item.slug,
    // Note: We don't store titles in session, so this would need to be enriched
    // from the main content metadata if needed
  }))
}

/**
 * Check if session storage is available
 */
export function isSessionStorageAvailable(): boolean {
  try {
    const test = '__session_storage_test__'
    sessionStorage.setItem(test, test)
    sessionStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}
