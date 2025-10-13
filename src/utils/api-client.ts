/**
 * API Client for Password Protected Content
 * 
 * Handles communication with the backend API for password verification
 * and protected content retrieval.
 */

import { config, getApiUrl } from '../config/environment'

export interface VerifyPasswordRequest {
  type: 'notes' | 'publications' | 'ideas' | 'pages'
  slug: string
  password: string
}

export interface VerifyPasswordResponse {
  success: boolean
  token?: string
  message?: string
}

export interface ProtectedContentResponse {
  slug: string
  title: string
  date: string
  readTime: string
  type: string
  excerpt: string
  content: string
  html: string
}

export interface ApiError {
  error: string
  message?: string
}

class ApiClient {
  constructor() {
    // Configuration is handled by the config module
  }

  /**
   * Verify password for a protected content item
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

      return await response.json()
    } catch (error) {
      console.error('Failed to fetch protected content:', error)
      throw error
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
