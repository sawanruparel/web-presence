/**
 * API Client for Password Protected Content
 * 
 * Handles communication with the backend API for password verification
 * and protected content retrieval.
 */

import { config, getApiUrl } from '../config/environment'
import type {
  VerifyPasswordRequest,
  VerifyPasswordResponse,
  ProtectedContentResponse,
  AccessCheckResponse,
  AccessMode,
  ApiError
} from '../../../types/api'

// Re-export types for convenience
export type {
  VerifyPasswordRequest,
  VerifyPasswordResponse,
  ProtectedContentResponse,
  AccessCheckResponse,
  AccessMode,
  ApiError
}

class ApiClient {
  constructor() {
    // Configuration is handled by the config module
  }

  /**
   * Check access requirements for a content item
   */
  async checkAccess(
    type: 'notes' | 'publications' | 'ideas' | 'pages',
    slug: string
  ): Promise<AccessCheckResponse> {
    try {
      const url = getApiUrl(`${config.endpoints.accessCheck}/${type}/${slug}`)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('404: Content not found')
        }
        throw new Error(`HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to check access:', error)
      throw error
    }
  }

  /**
   * Verify password or email for a protected content item
   */
  async verifyPassword(request: VerifyPasswordRequest): Promise<VerifyPasswordResponse> {
    try {
      const url = getApiUrl(config.endpoints.verifyPassword)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Password verification failed:', error)
      throw error
    }
  }

  /**
   * Get protected content after successful authentication
   */
  async getProtectedContent(
    type: 'notes' | 'publications' | 'ideas' | 'pages',
    slug: string,
    token: string
  ): Promise<ProtectedContentResponse> {
    try {
      const url = getApiUrl(`${config.endpoints.protectedContent}/${type}/${slug}`)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please try again.')
        }
        if (response.status === 404) {
          throw new Error('Content not found.')
        }
        
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
      }

      // Get HTML content from response
      const htmlContent = await response.text()
      
      // Parse metadata from HTML and return structured response
      return this.parseHtmlMetadata(htmlContent, type, slug)
    } catch (error) {
      console.error('Failed to fetch protected content:', error)
      throw error
    }
  }

  /**
   * Parse metadata from HTML content
   */
  private parseHtmlMetadata(html: string, type: string, slug: string): ProtectedContentResponse {
    // Create a temporary DOM element to parse the HTML
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Extract title from <title> or <h1>
    const title = doc.querySelector('title')?.textContent?.trim() || 
                  doc.querySelector('h1')?.textContent?.trim() || 
                  slug
    
    // Extract date from meta tag or time element
    const publishedTime = doc.querySelector('meta[name="article:published_time"]')?.getAttribute('content') ||
                         doc.querySelector('time[datetime]')?.getAttribute('datetime') ||
                         new Date().toISOString().split('T')[0]
    
    // Extract read time from meta tag or span element
    const readTimeMeta = doc.querySelector('meta[name="reading-time"]')?.getAttribute('content')
    const readTimeSpan = doc.querySelector('.read-time')?.textContent?.trim()
    const readTime = readTimeSpan || (readTimeMeta ? `${readTimeMeta} min` : '5 min')
    
    // Extract excerpt from meta description
    const excerpt = doc.querySelector('meta[name="description"]')?.getAttribute('content') || 
                   'Protected content'
    
    // Extract content from the article body (without the full HTML wrapper)
    const articleContent = doc.querySelector('article .content')?.innerHTML ||
                          doc.querySelector('main article')?.innerHTML ||
                          doc.querySelector('body')?.innerHTML ||
                          html
    
    return {
      slug,
      title,
      date: publishedTime.split('T')[0], // Just the date part
      readTime,
      type,
      excerpt,
      content: articleContent, // The article content without full HTML wrapper
      html: html // The full HTML content
    }
  }

  /**
   * Check if the API is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const url = getApiUrl(config.endpoints.health)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      return response.ok
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
