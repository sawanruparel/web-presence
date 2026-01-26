/**
 * Admin Content Overview Page
 * 
 * Displays all content from GitHub and database with alignment status.
 */

import { useState, useEffect } from 'react'
import { useAdminAuth } from '../hooks/use-admin-auth'
import { adminApiClient, type ContentOverviewItem } from '../utils/admin-api-client'
import { AdminLogin } from '../components/admin-login'
import { navigateTo } from '../utils/router'

export function AdminContentPage() {
  const { isAuthenticated, isLoading: authLoading, getToken, logout } = useAdminAuth()
  const [content, setContent] = useState<ContentOverviewItem[]>([])
  const [summary, setSummary] = useState<{ total: number; aligned: number; githubOnly: number; databaseOnly: number } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Will show login component
    }
  }, [authLoading, isAuthenticated])

  // Fetch content overview when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchContentOverview()
    }
  }, [isAuthenticated])

  const fetchContentOverview = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const token = getToken()
      if (!token) {
        throw new Error('No authentication token')
      }

      const data = await adminApiClient.getContentOverview(token)
      setContent(data.content)
      setSummary(data.summary)
    } catch (err) {
      console.error('Failed to fetch content overview:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch content overview')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginSuccess = () => {
    // Content will be fetched automatically by useEffect
  }

  const handleLogout = () => {
    logout()
    navigateTo('/')
  }

  // Filter content
  const filteredContent = content.filter(item => {
    // Type filter
    if (filterType !== 'all' && item.type !== filterType) {
      return false
    }

    // Status filter
    if (filterStatus !== 'all' && item.status !== filterStatus) {
      return false
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return (
        item.type.toLowerCase().includes(query) ||
        item.slug.toLowerCase().includes(query) ||
        (item.database.description?.toLowerCase().includes(query) ?? false)
      )
    }

    return true
  })

  // Show login if not authenticated
  if (!authLoading && !isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />
  }

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full'
    switch (status) {
      case 'aligned':
        return (
          <span className={baseClasses} style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            ✓ Aligned
          </span>
        )
      case 'github-only':
        return (
          <span className={baseClasses} style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
            ⚠ GitHub Only
          </span>
        )
      case 'database-only':
        return (
          <span className={baseClasses} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            ✗ Database Only
          </span>
        )
      default:
        return <span className={baseClasses}>{status}</span>
    }
  }

  const getAccessModeBadge = (accessMode?: string) => {
    if (!accessMode) return null
    
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded'
    switch (accessMode) {
      case 'open':
        return (
          <span className={baseClasses} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            Open
          </span>
        )
      case 'password':
        return (
          <span className={baseClasses} style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
            Password
          </span>
        )
      case 'email-list':
        return (
          <span className={baseClasses} style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
            Email List
          </span>
        )
      default:
        return <span className={baseClasses}>{accessMode}</span>
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
              Admin Content Overview
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              View all content and access control alignment
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium rounded-md border"
            style={{ 
              color: 'var(--color-text)', 
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-background)'
            }}
          >
            Logout
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total</div>
              <div className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text)' }}>{summary.total}</div>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Aligned</div>
              <div className="text-2xl font-bold mt-1" style={{ color: '#22c55e' }}>{summary.aligned}</div>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>GitHub Only</div>
              <div className="text-2xl font-bold mt-1" style={{ color: '#eab308' }}>{summary.githubOnly}</div>
            </div>
            <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Database Only</div>
              <div className="text-2xl font-bold mt-1" style={{ color: '#ef4444' }}>{summary.databaseOnly}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by type, slug, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              style={{ 
                backgroundColor: 'var(--color-background)', 
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)'
              }}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border rounded-md"
            style={{ 
              backgroundColor: 'var(--color-background)', 
              color: 'var(--color-text)',
              borderColor: 'var(--color-border)'
            }}
          >
            <option value="all">All Types</option>
            <option value="notes">Notes</option>
            <option value="ideas">Ideas</option>
            <option value="publications">Publications</option>
            <option value="pages">Pages</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-md"
            style={{ 
              backgroundColor: 'var(--color-background)', 
              color: 'var(--color-text)',
              borderColor: 'var(--color-border)'
            }}
          >
            <option value="all">All Status</option>
            <option value="aligned">Aligned</option>
            <option value="github-only">GitHub Only</option>
            <option value="database-only">Database Only</option>
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 rounded-md" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <p style={{ color: 'var(--color-error, #dc2626)' }}>{error}</p>
          </div>
        )}

        {/* Content Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ borderColor: 'var(--color-border)' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Slug</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>GitHub</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Database</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredContent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                    No content found
                  </td>
                </tr>
              ) : (
                filteredContent.map((item, index) => (
                  <tr 
                    key={`${item.type}-${item.slug}`}
                    style={{ 
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: index % 2 === 0 ? 'var(--color-background)' : 'transparent'
                    }}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
                      {item.type}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--color-text)' }}>
                      {item.slug}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
                      {item.github.exists ? (
                        <div>
                          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {item.github.size ? `${(item.github.size / 1024).toFixed(1)} KB` : '—'}
                          </div>
                          {item.github.sha && (
                            <div className="text-xs font-mono mt-1" style={{ color: 'var(--color-text-muted)' }}>
                              {item.github.sha.substring(0, 7)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>Not found</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
                      {item.database.exists ? (
                        <div>
                          <div className="mb-1">
                            {getAccessModeBadge(item.database.accessMode)}
                          </div>
                          {item.database.description && (
                            <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                              {item.database.description}
                            </div>
                          )}
                          {item.database.allowedEmails && item.database.allowedEmails.length > 0 && (
                            <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                              {item.database.allowedEmails.length} email{item.database.allowedEmails.length !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>No rule</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(item.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
