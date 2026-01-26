/**
 * Admin Build Logs Page
 * 
 * Displays build history and logs.
 */

import { useState, useEffect, useCallback } from 'react'
import { useAdminAuth } from '../hooks/use-admin-auth'
import { adminApiClient, type BuildLog } from '../utils/admin-api-client'
import { AdminLogin } from '../components/admin-login'
import { navigateTo } from '../utils/router'

export function AdminBuildLogsPage() {
  const { isAuthenticated, isLoading: authLoading, getToken, logout } = useAdminAuth()
  const [buildLogs, setBuildLogs] = useState<BuildLog[]>([])
  const [selectedLog, setSelectedLog] = useState<BuildLog | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterBuildType, setFilterBuildType] = useState<string>('all')
  const [hasFetched, setHasFetched] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Will show login component
    }
  }, [authLoading, isAuthenticated])

  const fetchBuildLogs = useCallback(async (force = false) => {
    if (!force && hasFetched && buildLogs.length > 0) {
      console.log('⏭️ Build logs already fetched, skipping...')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const token = getToken()
      if (!token) {
        throw new Error('No authentication token')
      }

      console.log('📡 Fetching build logs with token...')
      const data = await adminApiClient.getBuildLogs(token, {
        limit: 100,
        status: filterStatus !== 'all' ? filterStatus as 'success' | 'failed' | 'in_progress' : undefined,
        buildType: filterBuildType !== 'all' ? filterBuildType as 'web' | 'api' | 'full' : undefined
      })
      console.log('✅ Build logs fetched:', data)
      setBuildLogs(data.buildLogs)
      setHasFetched(true)
    } catch (err) {
      console.error('❌ Failed to fetch build logs:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch build logs')
      setHasFetched(false)
    } finally {
      setIsLoading(false)
    }
  }, [getToken, hasFetched, buildLogs.length, filterStatus, filterBuildType])

  // Fetch build logs when authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading && !hasFetched) {
      console.log('🔐 Admin authenticated, fetching build logs...')
      fetchBuildLogs()
    }
  }, [isAuthenticated, authLoading, hasFetched, fetchBuildLogs])

  // Refetch when filters change
  useEffect(() => {
    if (isAuthenticated && hasFetched) {
      setHasFetched(false)
      fetchBuildLogs(true)
    }
  }, [filterStatus, filterBuildType])

  const handleLoginSuccess = () => {
    console.log('✅ Login success callback called')
    setHasFetched(false)
  }

  const handleLogout = () => {
    logout()
    navigateTo('/')
  }

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '—'
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full'
    switch (status) {
      case 'success':
        return (
          <span className={baseClasses} style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            ✓ Success
          </span>
        )
      case 'failed':
        return (
          <span className={baseClasses} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            ✗ Failed
          </span>
        )
      case 'in_progress':
        return (
          <span className={baseClasses} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            ⏳ In Progress
          </span>
        )
      default:
        return <span className={baseClasses}>{status}</span>
    }
  }

  const getBuildTypeBadge = (buildType: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded'
    switch (buildType) {
      case 'web':
        return (
          <span className={baseClasses} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            Web
          </span>
        )
      case 'api':
        return (
          <span className={baseClasses} style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
            API
          </span>
        )
      case 'full':
        return (
          <span className={baseClasses} style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
            Full
          </span>
        )
      default:
        return <span className={baseClasses}>{buildType}</span>
    }
  }

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
              Build Logs
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              View build history and logs
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigateTo('/admin/content')}
              className="px-4 py-2 text-sm font-medium rounded-md border"
              style={{ 
                color: 'var(--color-text)', 
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-background)'
              }}
            >
              Content Overview
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

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-4 items-center">
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
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="in_progress">In Progress</option>
          </select>
          <select
            value={filterBuildType}
            onChange={(e) => setFilterBuildType(e.target.value)}
            className="px-3 py-2 border rounded-md"
            style={{ 
              backgroundColor: 'var(--color-background)', 
              color: 'var(--color-text)',
              borderColor: 'var(--color-border)'
            }}
          >
            <option value="all">All Types</option>
            <option value="web">Web</option>
            <option value="api">API</option>
            <option value="full">Full</option>
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 rounded-md" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <p style={{ color: 'var(--color-error, #dc2626)' }}>{error}</p>
          </div>
        )}

        {/* Build Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ borderColor: 'var(--color-border)' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Started</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Duration</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Triggered By</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buildLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
                    No build logs found
                  </td>
                </tr>
              ) : (
                buildLogs.map((log, index) => (
                  <tr 
                    key={log.id}
                    style={{ 
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: index % 2 === 0 ? 'var(--color-background)' : 'transparent'
                    }}
                  >
                    <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--color-text)' }}>
                      {log.id}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getBuildTypeBadge(log.build_type)}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
                      {formatTimestamp(log.started_at)}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
                      {formatDuration(log.duration_seconds)}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
                      {log.triggered_by || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-3 py-1 text-xs font-medium rounded border"
                        style={{ 
                          color: 'var(--color-text)', 
                          borderColor: 'var(--color-border)',
                          backgroundColor: 'var(--color-background)'
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Build Log Detail Modal */}
        {selectedLog && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => setSelectedLog(null)}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              style={{ 
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                  Build Log #{selectedLog.id}
                </h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-2xl font-bold"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Build Type</div>
                    <div style={{ color: 'var(--color-text)' }}>{getBuildTypeBadge(selectedLog.build_type)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Status</div>
                    <div>{getStatusBadge(selectedLog.status)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Started</div>
                    <div style={{ color: 'var(--color-text)' }}>{formatTimestamp(selectedLog.started_at)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Completed</div>
                    <div style={{ color: 'var(--color-text)' }}>
                      {selectedLog.completed_at ? formatTimestamp(selectedLog.completed_at) : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Duration</div>
                    <div style={{ color: 'var(--color-text)' }}>{formatDuration(selectedLog.duration_seconds)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Triggered By</div>
                    <div style={{ color: 'var(--color-text)' }}>{selectedLog.triggered_by || '—'}</div>
                  </div>
                  {selectedLog.git_commit_sha && (
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Git Commit</div>
                      <div className="font-mono text-sm" style={{ color: 'var(--color-text)' }}>
                        {selectedLog.git_commit_sha.substring(0, 7)}
                      </div>
                    </div>
                  )}
                  {selectedLog.git_branch && (
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Git Branch</div>
                      <div style={{ color: 'var(--color-text)' }}>{selectedLog.git_branch}</div>
                    </div>
                  )}
                </div>

                {selectedLog.error_message && (
                  <div>
                    <div className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>Error Message</div>
                    <div className="p-3 rounded-md" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                      {selectedLog.error_message}
                    </div>
                  </div>
                )}

                {selectedLog.log_output && (
                  <div>
                    <div className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>Log Output</div>
                    <pre className="p-3 rounded-md overflow-x-auto text-xs font-mono" style={{ 
                      backgroundColor: 'var(--color-background)', 
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)'
                    }}>
                      {selectedLog.log_output}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
