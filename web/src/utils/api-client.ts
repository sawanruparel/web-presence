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
          throw new Error('Content not found')
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
