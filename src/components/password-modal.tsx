import React, { useState } from 'react'
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '@headlessui/react'
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface PasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (password: string) => Promise<void>
  title: string
  isLoading?: boolean
  error?: string
}

export function PasswordModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title, 
  isLoading = false, 
  error 
}: PasswordModalProps) {
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return
    
    try {
      await onSubmit(password)
      setPassword('') // Clear password on success
    } catch (err) {
      // Error handling is done by parent component
    }
  }

  const handleClose = () => {
    setPassword('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              Protected Content
            </DialogTitle>
            <button
              onClick={handleClose}
              className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              disabled={isLoading}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <DialogDescription className="mb-4" style={{ color: 'var(--color-text-muted)' }}>
            This content is password protected. Please enter the password to continue.
          </DialogDescription>

          <div className="mb-4 p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-200">Content: {title}</p>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  Enter the password to view this protected content.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: 'var(--color-background)', 
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)'
                }}
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !password.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Access Content'}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
