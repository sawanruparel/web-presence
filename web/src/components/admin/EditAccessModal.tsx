import type { ContentOverviewItem } from '../../utils/admin-api-client'

export interface EditFormState {
  accessMode: 'open' | 'password' | 'email-list'
  description: string
  password: string
  allowedEmails: string
}

interface EditAccessModalProps {
  item: ContentOverviewItem
  form: EditFormState
  isSaving: boolean
  error: string | null
  onChange: (form: EditFormState) => void
  onCancel: () => void
  onSave: () => void
}

export function EditAccessModal({
  item,
  form,
  isSaving,
  error,
  onChange,
  onCancel,
  onSave
}: EditAccessModalProps) {
  const isNew = !item.database.exists

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onCancel}
    >
      <div
        className="rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--color-background)',
          border: '1px solid var(--color-border)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
          {isNew ? 'Create' : 'Edit'} Access Rule: {item.type}/{item.slug}
        </h3>

        {error && (
          <div
            className="mb-4 p-3 rounded-md"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
          >
            <p className="text-sm" style={{ color: 'var(--color-error, #dc2626)' }}>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Access Mode
            </label>
            <select
              value={form.accessMode}
              onChange={(e) => onChange({ ...form, accessMode: e.target.value as EditFormState['accessMode'] })}
              className="w-full px-3 py-2 border rounded-md"
              style={{
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)'
              }}
            >
              <option value="open">Open</option>
              <option value="password">Password</option>
              <option value="email-list">Email List</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => onChange({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              style={{
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text)',
                borderColor: 'var(--color-border)'
              }}
              placeholder="Optional description"
            />
          </div>

          {form.accessMode === 'password' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Password {isNew ? '(required)' : '(leave blank to keep current)'}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => onChange({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                style={{
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)'
                }}
                placeholder="Enter new password"
              />
            </div>
          )}

          {form.accessMode === 'email-list' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Allowed Emails (one per line)
              </label>
              <textarea
                value={form.allowedEmails}
                onChange={(e) => onChange({ ...form, allowedEmails: e.target.value })}
                className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                style={{
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)'
                }}
                rows={6}
                placeholder={'user@example.com\nadmin@example.com'}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Enter one email address per line
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onCancel}
            disabled={isSaving}
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
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium rounded text-white"
            style={{ backgroundColor: isSaving ? '#9ca3af' : '#3b82f6' }}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
