/**
 * Admin Authentication Hook
 * 
 * Manages admin session state and authentication.
 * Provides login, logout, and authentication status functions.
 */

import { useState, useEffect, useCallback } from 'react'

const ADMIN_TOKEN_KEY = 'admin_session_token'

interface AdminTokenData {
  type: 'admin'
  timestamp: number
  exp: number
}

/**
 * Check if admin token is valid
 */
function isTokenValid(token: string): boolean {
  try {
    const tokenData: AdminTokenData = JSON.parse(atob(token))
    
    // Check if it's an admin token
    if (tokenData.type !== 'admin') {
      return false
    }
    
    // Check if token is expired
    if (tokenData.exp && tokenData.exp < Math.floor(Date.now() / 1000)) {
      return false
    }
    
    return true
  } catch {
    return false
  }
}

/**
 * Get admin token from localStorage
 */
function getAdminToken(): string | null {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)
  if (!token) {
    return null
  }
  
  if (!isTokenValid(token)) {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    return null
  }
  
  return token
}

/**
 * Store admin token in localStorage
 */
function storeAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token)
}

/**
 * Remove admin token from localStorage
 */
function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
}

/**
 * Hook for admin authentication
 */
export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Check authentication status on mount
  useEffect(() => {
    const token = getAdminToken()
    setIsAuthenticated(!!token)
    setIsLoading(false)
  }, [])

  /**
   * Login with password
   */
  const login = useCallback(async (password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'}/api/admin/auth`, {
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

      if (data.token) {
        storeAdminToken(data.token)
        setIsAuthenticated(true)
        return { success: true }
      }

      return {
        success: false,
        message: 'No token received'
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error'
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Logout
   */
  const logout = useCallback(() => {
    clearAdminToken()
    setIsAuthenticated(false)
  }, [])

  /**
   * Get admin token for API requests
   */
  const getToken = useCallback((): string | null => {
    return getAdminToken()
  }, [])

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    getToken
  }
}
