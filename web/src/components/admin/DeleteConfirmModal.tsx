interface DeleteConfirmModalProps {
  target: { type: string; slug: string }
  isDeleting: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteConfirmModal({
  target,
  isDeleting,
  error,
  onCancel,
  onConfirm
}: DeleteConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onCancel}
    >
      <div
        className="rounded-lg p-6 max-w-md w-full mx-4"
        style={{
          backgroundColor: 'var(--color-background)',
          border: '1px solid var(--color-border)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
          Confirm Delete
        </h3>

        {error && (
          <div
            className="mb-4 p-3 rounded-md"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
          >
            <p className="text-sm" style={{ color: 'var(--color-error, #dc2626)' }}>{error}</p>
          </div>
        )}

        <p className="mb-4" style={{ color: 'var(--color-text-muted)' }}>
          Are you sure you want to delete the access rule for{' '}
          <strong style={{ color: 'var(--color-text)' }}>
            {target.type}/{target.slug}
          </strong>?
          This action cannot be undone.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium rounded border"
            style={{
              color: 'var(--color-text)',
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-background)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium rounded text-white"
            style={{ backgroundColor: isDeleting ? '#9ca3af' : '#ef4444' }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
