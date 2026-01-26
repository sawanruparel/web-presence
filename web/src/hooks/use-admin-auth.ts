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

  // Check authentication status on mount and when storage changes
  useEffect(() => {
    const checkAuth = () => {
      const token = getAdminToken()
      setIsAuthenticated(!!token)
      setIsLoading(false)
    }

    // Check immediately
    checkAuth()

    // Listen for storage changes (from other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ADMIN_TOKEN_KEY) {
        checkAuth()
      }
    }

    // Listen for custom auth events (from same window)
    const handleAuthChange = () => {
      checkAuth()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('admin-auth-change', handleAuthChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('admin-auth-change', handleAuthChange)
    }
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
        // Dispatch event to notify other hook instances
        window.dispatchEvent(new Event('admin-auth-change'))
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
    // Dispatch event to notify other hook instances
    window.dispatchEvent(new Event('admin-auth-change'))
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
