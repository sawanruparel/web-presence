/**
 * Admin API Client
 * 
 * Handles communication with the backend API for admin operations.
 */

/**
 * Admin API Client
 * 
 * Handles communication with the backend API for admin operations.
 */

export interface ContentOverviewItem {
  type: string
  slug: string
  github: {
    exists: boolean
    path?: string
    sha?: string
    size?: number
  }
  database: {
    exists: boolean
    accessMode?: string
    description?: string | null
    allowedEmails?: string[]
    updatedAt?: string
    needsRebuild?: boolean
  }
  status: 'aligned' | 'github-only' | 'database-only'
}

export interface ContentOverviewResponse {
  content: ContentOverviewItem[]
  summary: {
    total: number
    aligned: number
    githubOnly: number
    databaseOnly: number
  }
  lastBuildTimestamp: string | null
  timestamp: string
}

export interface BuildLog {
  id: number
  build_type: string
  status: string
  started_at: string
  completed_at: string | null
  duration_seconds: number | null
  log_output: string | null
  error_message: string | null
  triggered_by: string | null
  git_commit_sha: string | null
  git_branch: string | null
  created_at: string
}

export interface BuildLogsResponse {
  buildLogs: BuildLog[]
  total: number
  limit: number
  offset: number
}

class AdminApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'
  }

  /**
   * Authenticate with password
   */
  async authenticate(password: string): Promise<{ success: boolean; token?: string; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        return {
          success: false,
          message: data.message || 'Authentication failed'
        }
      }

      return {
        success: true,
        token: data.token
      }
    } catch (error) {
      console.error('Admin authentication error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  /**
   * Get content overview (requires admin token)
   */
  async getContentOverview(token: string): Promise<ContentOverviewResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/content-overview`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.')
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to fetch content overview:', error)
      throw error
    }
  }

  /**
   * Delete access rule (requires admin token)
   */
  async deleteAccessRule(
    token: string,
    type: string,
    slug: string
  ): Promise<{ message: string; type: string; slug: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/access-rules/${type}/${slug}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.')
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to delete access rule:', error)
      throw error
    }
  }

  /**
   * Create access rule (requires admin token)
   */
  async createAccessRule(
    token: string,
    type: string,
    slug: string,
    rule: {
      accessMode: 'open' | 'password' | 'email-list'
      description?: string
      password?: string
      allowedEmails?: string[]
    }
  ): Promise<{ message: string; rule: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/access-rules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          slug,
          accessMode: rule.accessMode,
          description: rule.description,
          password: rule.password,
          allowedEmails: rule.allowedEmails
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.')
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to create access rule:', error)
      throw error
    }
  }

  /**
   * Update access rule (requires admin token)
   */
  async updateAccessRule(
    token: string,
    type: string,
    slug: string,
    updates: {
      accessMode?: 'open' | 'password' | 'email-list'
      description?: string
      password?: string
      allowedEmails?: string[]
    }
  ): Promise<{ message: string; rule: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/access-rules/${type}/${slug}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.')
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to update access rule:', error)
      throw error
    }
  }

  /**
   * Get build logs (requires admin token)
   */
  async getBuildLogs(
    token: string,
    options?: {
      limit?: number
      offset?: number
      status?: 'success' | 'failed' | 'in_progress'
      buildType?: 'web' | 'api' | 'full'
    }
  ): Promise<BuildLogsResponse> {
    try {
      const params = new URLSearchParams()
      if (options?.limit) params.append('limit', options.limit.toString())
      if (options?.offset) params.append('offset', options.offset.toString())
      if (options?.status) params.append('status', options.status)
      if (options?.buildType) params.append('buildType', options.buildType)

      const url = `${this.baseUrl}/api/admin/build-logs${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.')
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to fetch build logs:', error)
      throw error
    }
  }

  /**
   * Get specific build log (requires admin token)
   */
  async getBuildLog(token: string, id: number): Promise<{ buildLog: BuildLog }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/build-logs/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.')
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to fetch build log:', error)
      throw error
    }
  }
}

// Export singleton instance
export const adminApiClient = new AdminApiClient()
