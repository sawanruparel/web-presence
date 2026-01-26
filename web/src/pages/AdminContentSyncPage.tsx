/**
 * Admin Content Sync Page
 * 
 * Dedicated page for content synchronization with detailed bucket operations.
 */

import { useState, useEffect, useCallback } from 'react'
import { useAdminAuth } from '../hooks/use-admin-auth'
import { adminApiClient } from '../utils/admin-api-client'
import { AdminLogin } from '../components/admin-login'
import { navigateTo } from '../utils/router'

interface UploadDetail {
  bucket: 'protected' | 'public'
  key: string
  size: number
}

interface DeleteDetail {
  bucket: 'protected' | 'public'
  key: string
}

interface SyncResult {
  success: boolean
  processed: number
  uploaded: number
  deleted: number
  errors: string[]
  logs: string[]
  metadata: {
    public: number
    protected: number
  }
  uploadDetails: UploadDetail[]
  deleteDetails: DeleteDetail[]
}

export function AdminContentSyncPage() {
  const { isAuthenticated, isLoading: authLoading, getToken, logout } = useAdminAuth()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncLogs, setSyncLogs] = useState<string[]>([])
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSyncContent = useCallback(async () => {
    setIsSyncing(true)
    setSyncLogs([])
    setSyncResult(null)
    setError(null)

    try {
      const token = getToken()
      if (!token) {
        throw new Error('No authentication token')
      }

      const result = await adminApiClient.syncContent(token)
      
      setSyncLogs(result.logs || [])
      setSyncResult({
        success: result.success,
        processed: result.processed,
        uploaded: result.uploaded,
        deleted: result.deleted,
        errors: result.errors,
        logs: result.logs || [],
        metadata: result.metadata,
        uploadDetails: result.uploadDetails || [],
        deleteDetails: result.deleteDetails || []
      })
    } catch (err) {
      console.error('Failed to sync content:', err)
      setError(err instanceof Error ? err.message : 'Failed to sync content')
      setSyncLogs(prev => [...prev, `❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`])
    } finally {
      setIsSyncing(false)
    }
  }, [getToken])

  // Show login if not authenticated
  if (!authLoading && !isAuthenticated) {
    return <AdminLogin onLoginSuccess={() => {}} />
  }

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
      </div>
    )
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
              Content Sync
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Synchronize content from GitHub to R2 buckets
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
              onClick={() => {
                logout()
                navigateTo('/')
              }}
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

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 rounded-md" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <p style={{ color: 'var(--color-error, #dc2626)' }}>{error}</p>
          </div>
        )}

        {/* Sync Button */}
        <div className="mb-6">
          <button
            onClick={handleSyncContent}
            disabled={isSyncing}
            className="px-6 py-3 text-base font-medium rounded-md text-white"
            style={{ 
              backgroundColor: isSyncing ? '#9ca3af' : '#3b82f6',
              cursor: isSyncing ? 'not-allowed' : 'pointer'
            }}
          >
            {isSyncing ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Syncing...
              </span>
            ) : (
              'Start Content Sync'
            )}
          </button>
        </div>

        {/* Sync Logs */}
        {syncLogs.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
              Sync Logs
            </h2>
            <div 
              className="p-4 rounded border font-mono text-xs overflow-auto max-h-96"
              style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)'
              }}
            >
              {syncLogs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sync Result Summary */}
        {syncResult && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
              Sync Results
            </h2>
            <div className={`p-4 rounded border ${syncResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                {syncResult.success ? '✅ Sync Completed Successfully' : '❌ Sync Completed with Errors'}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <div style={{ color: 'var(--color-text-muted)' }}>Processed</div>
                  <div className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{syncResult.processed}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-muted)' }}>Uploaded</div>
                  <div className="text-lg font-bold" style={{ color: '#22c55e' }}>{syncResult.uploaded}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-muted)' }}>Deleted</div>
                  <div className="text-lg font-bold" style={{ color: '#ef4444' }}>{syncResult.deleted}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-muted)' }}>Public</div>
                  <div className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{syncResult.metadata.public}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-muted)' }}>Protected</div>
                  <div className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{syncResult.metadata.protected}</div>
                </div>
              </div>
              {syncResult.errors.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-semibold mb-2" style={{ color: '#ef4444' }}>
                    Errors:
                  </div>
                  <ul className="list-disc list-inside text-sm" style={{ color: '#ef4444' }}>
                    {syncResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Details */}
        {syncResult && syncResult.uploadDetails.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
              Uploaded Files ({syncResult.uploadDetails.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ borderColor: 'var(--color-border)' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Bucket</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Key</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Size</th>
                  </tr>
                </thead>
                <tbody>
                  {syncResult.uploadDetails.map((detail, index) => (
                    <tr 
                      key={index}
                      style={{ 
                        borderBottom: '1px solid var(--color-border)',
                        backgroundColor: index % 2 === 0 ? 'var(--color-background)' : 'transparent'
                      }}
                    >
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
                        <span 
                          className="px-2 py-1 text-xs font-medium rounded"
                          style={{ 
                            backgroundColor: detail.bucket === 'protected' 
                              ? 'rgba(168, 85, 247, 0.1)' 
                              : 'rgba(59, 130, 246, 0.1)',
                            color: detail.bucket === 'protected' ? '#a855f7' : '#3b82f6'
                          }}
                        >
                          {detail.bucket}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--color-text)' }}>
                        {detail.key}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {formatBytes(detail.size)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Delete Details */}
        {syncResult && syncResult.deleteDetails.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
              Deleted Files ({syncResult.deleteDetails.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ borderColor: 'var(--color-border)' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Bucket</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Key</th>
                  </tr>
                </thead>
                <tbody>
                  {syncResult.deleteDetails.map((detail, index) => (
                    <tr 
                      key={index}
                      style={{ 
                        borderBottom: '1px solid var(--color-border)',
                        backgroundColor: index % 2 === 0 ? 'var(--color-background)' : 'transparent'
                      }}
                    >
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
                        <span 
                          className="px-2 py-1 text-xs font-medium rounded"
                          style={{ 
                            backgroundColor: detail.bucket === 'protected' 
                              ? 'rgba(168, 85, 247, 0.1)' 
                              : 'rgba(59, 130, 246, 0.1)',
                            color: detail.bucket === 'protected' ? '#a855f7' : '#3b82f6'
                          }}
                        >
                          {detail.bucket}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--color-text)' }}>
                        {detail.key}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
