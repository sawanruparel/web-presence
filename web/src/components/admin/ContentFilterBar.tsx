interface ContentFilterBarProps {
  searchQuery: string
  filterType: string
  filterStatus: string
  onSearchChange: (value: string) => void
  onTypeChange: (value: string) => void
  onStatusChange: (value: string) => void
}

export function ContentFilterBar({
  searchQuery,
  filterType,
  filterStatus,
  onSearchChange,
  onTypeChange,
  onStatusChange
}: ContentFilterBarProps) {
  const selectStyle = {
    backgroundColor: 'var(--color-background)',
    color: 'var(--color-text)',
    borderColor: 'var(--color-border)'
  }

  return (
    <div className="mb-4 flex flex-wrap gap-4 items-center">
      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          placeholder="Search by type, slug, or description..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          style={selectStyle}
        />
      </div>

      <select
        value={filterType}
        onChange={(e) => onTypeChange(e.target.value)}
        className="px-3 py-2 border rounded-md"
        style={selectStyle}
      >
        <option value="all">All Types</option>
        <option value="notes">Notes</option>
        <option value="ideas">Ideas</option>
        <option value="publications">Publications</option>
        <option value="pages">Pages</option>
      </select>

      <select
        value={filterStatus}
        onChange={(e) => onStatusChange(e.target.value)}
        className="px-3 py-2 border rounded-md"
        style={selectStyle}
      >
        <option value="all">All Status</option>
        <option value="aligned">Aligned</option>
        <option value="github-only">GitHub Only</option>
        <option value="database-only">Database Only</option>
      </select>
    </div>
  )
}
