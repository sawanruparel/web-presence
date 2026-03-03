/**
 * Admin Content Overview Page
 * 
 * Displays all content from GitHub and database with alignment status.
 */

import { useState, useEffect, useCallback } from 'react'
import { useAdminAuth } from '../hooks/use-admin-auth'
import { adminApiClient, type ContentOverviewItem } from '../utils/admin-api-client'
import { AdminLogin } from '../components/admin-login'
import { navigateTo } from '../utils/router'
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal'
import { EditAccessModal, type EditFormState } from '../components/admin/EditAccessModal'
import { ContentFilterBar } from '../components/admin/ContentFilterBar'

export function AdminContentPage() {
  const { isAuthenticated, isLoading: authLoading, getToken, logout } = useAdminAuth()
  const [content, setContent] = useState<ContentOverviewItem[]>([])
  const [summary, setSummary] = useState<{ total: number; aligned: number; githubOnly: number; databaseOnly: number } | null>(null)
  const [lastBuildTimestamp, setLastBuildTimestamp] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [hasFetched, setHasFetched] = useState(false)
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; slug: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Edit modal state
  const [editItem, setEditItem] = useState<ContentOverviewItem | null>(null)
  const [editForm, setEditForm] = useState<EditFormState | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Will show login component
    }
  }, [authLoading, isAuthenticated])

  const fetchContentOverview = useCallback(async (force = false) => {
    if (!force && hasFetched && content.length > 0) {
      console.log('⏭️ Content already fetched, skipping...')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const token = getToken()
      if (!token) {
        throw new Error('No authentication token')
      }

      console.log('📡 Fetching content overview with token...')
      const data = await adminApiClient.getContentOverview(token)
      console.log('✅ Content overview fetched:', data)
      setContent(data.content)
      setSummary(data.summary)
      setLastBuildTimestamp(data.lastBuildTimestamp || null)
      setHasFetched(true)
    } catch (err) {
      console.error('❌ Failed to fetch content overview:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch content overview')
      setHasFetched(false)
    } finally {
      setIsLoading(false)
    }
  }, [getToken, hasFetched, content.length])

  // Fetch content overview when authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading && !hasFetched) {
      console.log('🔐 Admin authenticated, fetching content overview...')
      fetchContentOverview()
    }
  }, [isAuthenticated, authLoading, hasFetched, fetchContentOverview])

  const handleLoginSuccess = () => {
    console.log('✅ Login success callback called')
    // Reset fetch flag so content will be fetched when isAuthenticated updates
    setHasFetched(false)
    // The useEffect hook will automatically fetch content when isAuthenticated becomes true
  }

  const handleLogout = () => {
    logout()
    navigateTo('/')
  }

  const handleDeleteClick = (type: string, slug: string) => {
    setDeleteConfirm({ type, slug })
  }

  const handleDeleteCancel = () => {
    setDeleteConfirm(null)
    setError(null) // Clear error when closing modal
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return
    
    setIsDeleting(true)
    setError(null)
    
    try {
      const token = getToken()
      if (!token) {
        throw new Error('No authentication token')
      }

      await adminApiClient.deleteAccessRule(token, deleteConfirm.type, deleteConfirm.slug)
      
      // Refresh content overview with loading state
      setIsRefreshing(true)
      try {
        await fetchContentOverview(true)
        setDeleteConfirm(null)
      } finally {
        setIsRefreshing(false)
      }
    } catch (err) {
      console.error('Failed to delete access rule:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete access rule'
      setError(errorMessage)
      // Don't close modal on error so user can see the error and try again or cancel
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditClick = (item: ContentOverviewItem) => {
    if (!item.database.exists) {
      // If no database entry exists, initialize with defaults
      setEditForm({
        accessMode: 'open',
        description: '',
        password: '',
        allowedEmails: ''
      })
    } else {
      setEditForm({
        accessMode: (item.database.accessMode as 'open' | 'password' | 'email-list') || 'open',
        description: item.database.description || '',
        password: '',
        allowedEmails: item.database.allowedEmails?.join('\n') || ''
      })
    }
    setEditItem(item)
  }

  const handleEditCancel = () => {
    setEditItem(null)
    setEditForm(null)
  }

  const handleEditSave = async () => {
    if (!editItem || !editForm) return

    setIsSaving(true)
    setError(null)

    try {
      const token = getToken()
      if (!token) {
        throw new Error('No authentication token')
      }

      const ruleData: {
        accessMode: 'open' | 'password' | 'email-list'
        description?: string
        password?: string
        allowedEmails?: string[]
      } = {
        accessMode: editForm.accessMode,
        description: editForm.description || undefined
      }

      if (editForm.accessMode === 'password') {
        if (!editForm.password && !editItem.database.exists) {
          throw new Error('Password is required for password mode')
        }
        if (editForm.password) {
          ruleData.password = editForm.password
        }
      }

      if (editForm.accessMode === 'email-list') {
        ruleData.allowedEmails = editForm.allowedEmails
          .split('\n')
          .map(email => email.trim())
          .filter(email => email.length > 0)
      } else {
        // Clear emails if not email-list mode
        ruleData.allowedEmails = []
      }

      // Create new entry if it doesn't exist, otherwise update
      if (!editItem.database.exists) {
        await adminApiClient.createAccessRule(token, editItem.type, editItem.slug, ruleData)
      } else {
        await adminApiClient.updateAccessRule(token, editItem.type, editItem.slug, ruleData)
      }

      // Refresh content overview with loading state
      setIsRefreshing(true)
      try {
        await fetchContentOverview(true)
        setEditItem(null)
        setEditForm(null)
      } finally {
        setIsRefreshing(false)
      }
    } catch (err) {
      console.error('Failed to save access rule:', err)
      setError(err instanceof Error ? err.message : 'Failed to save access rule')
    } finally {
      setIsSaving(false)
    }
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
  if (authLoading || (isLoading && !hasFetched)) {
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

  const getContentUrl = (type: string, slug: string): string => {
    if (type === 'pages') {
      return `/${slug}`
    }
    return `/${type}/${slug}`
  }

  const formatBuildTimestamp = (timestamp: string | null): string => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    return date.toLocaleString()
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
            {lastBuildTimestamp && (
              <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Last build: {formatBuildTimestamp(lastBuildTimestamp)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigateTo('/admin/content-sync')}
              className="px-4 py-2 text-sm font-medium rounded-md border"
              style={{ 
                color: 'var(--color-text)', 
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-background)'
              }}
            >
              Sync Content
            </button>
            <button
              onClick={() => navigateTo('/admin/build-logs')}
              className="px-4 py-2 text-sm font-medium rounded-md border"
              style={{ 
                color: 'var(--color-text)', 
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-background)'
              }}
            >
              Build Logs
            </button>
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
        <ContentFilterBar
          searchQuery={searchQuery}
          filterType={filterType}
          filterStatus={filterStatus}
          onSearchChange={setSearchQuery}
          onTypeChange={setFilterType}
          onStatusChange={setFilterStatus}
        />

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 rounded-md" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <p style={{ color: 'var(--color-error, #dc2626)' }}>{error}</p>
          </div>
        )}

        {/* Refreshing Overlay */}
        {isRefreshing && (
          <div className="mb-4 p-3 rounded-md border" style={{ 
            backgroundColor: 'rgba(59, 130, 246, 0.1)', 
            borderColor: 'rgba(59, 130, 246, 0.3)' 
          }}>
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              <span style={{ color: '#3b82f6' }}>Refreshing...</span>
            </div>
          </div>
        )}

        {/* Content Table */}
        <div className="overflow-x-auto relative">
          {isRefreshing && (
            <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}>
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                <span style={{ color: 'var(--color-text)' }}>Updating...</span>
              </div>
            </div>
          )}
          <table className="w-full border-collapse" style={{ borderColor: 'var(--color-border)' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Slug</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Link</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>GitHub</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Database</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>R2 Bucket</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContent.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
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
                        <a
                          href={getContentUrl(item.type, item.slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 underline"
                        >
                          View
                        </a>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                      )}
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
                          <div className="mb-1 flex items-center gap-2">
                            {getAccessModeBadge(item.database.accessMode)}
                            {item.database.needsRebuild && (
                              <span
                                className="px-2 py-1 text-xs font-medium rounded-full"
                                style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}
                                title="Database rule updated after last build - rebuild needed"
                              >
                                ⚠ Rebuild
                              </span>
                            )}
                          </div>
                          {item.database.description && (
                            <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                              {item.database.description}
                            </div>
                          )}
                          {item.database.allowedEmails && item.database.allowedEmails.length > 0 && (
                            <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                              <div className="font-semibold">
                                {item.database.allowedEmails.length} email{item.database.allowedEmails.length !== 1 ? 's' : ''}
                              </div>
                              {item.database.accessMode === 'email-list' && (
                                <div className="mt-1 font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                  {item.database.allowedEmails.slice(0, 3).map((email, idx) => (
                                    <div key={idx}>{email}</div>
                                  ))}
                                  {item.database.allowedEmails.length > 3 && (
                                    <div>... and {item.database.allowedEmails.length - 3} more</div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span
                          className="px-2 py-1 text-xs font-medium rounded"
                          style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#ca8a04' }}
                          title="No access rule set — content defaults to open. Add a rule to make it explicit."
                        >
                          ⚠ No rule (defaults open)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
                      {item.r2.exists ? (
                        <div>
                          <div className="mb-1">
                            <span 
                              className="px-2 py-1 text-xs font-medium rounded"
                              style={{ 
                                backgroundColor: item.r2.bucket === 'protected' 
                                  ? 'rgba(168, 85, 247, 0.1)' 
                                  : 'rgba(59, 130, 246, 0.1)',
                                color: item.r2.bucket === 'protected' ? '#a855f7' : '#3b82f6'
                              }}
                            >
                              {item.r2.bucket === 'protected' ? '🔒 Protected' : '🌐 Public'}
                            </span>
                          </div>
                          {item.r2.size && (
                            <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                              {(item.r2.size / 1024).toFixed(1)} KB
                            </div>
                          )}
                          {item.r2.uploaded && (
                            <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                              {new Date(item.r2.uploaded).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>Not in bucket</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="px-3 py-1 text-xs font-medium rounded border"
                          style={{ 
                            color: 'var(--color-text)', 
                            borderColor: 'var(--color-border)',
                            backgroundColor: 'var(--color-background)'
                          }}
                        >
                          {item.database.exists ? 'Edit' : 'Create'}
                        </button>
                        {item.database.exists && (
                          <button
                            onClick={() => handleDeleteClick(item.type, item.slug)}
                            className="px-3 py-1 text-xs font-medium rounded border"
                            style={{ 
                              color: '#ef4444', 
                              borderColor: '#ef4444',
                              backgroundColor: 'transparent'
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <DeleteConfirmModal
            target={deleteConfirm}
            isDeleting={isDeleting}
            error={error}
            onCancel={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
          />
        )}

        {/* Edit Modal */}
        {editItem && editForm && (
          <EditAccessModal
            item={editItem}
            form={editForm}
            isSaving={isSaving}
            error={error}
            onChange={setEditForm}
            onCancel={handleEditCancel}
            onSave={handleEditSave}
          />
        )}
      </div>
    </div>
  )
}
