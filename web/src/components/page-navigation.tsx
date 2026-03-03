interface PageNavigationProps {
  currentPage?: string
}

export function PageNavigation({ currentPage }: PageNavigationProps) {
  const links = [
    { href: '/about', label: 'About', key: 'about' },
    { href: '/notes', label: 'Notes', key: 'notes' },
    { href: '/publications', label: 'Publications', key: 'publications' },
    { href: '/ideas', label: 'Ideas', key: 'ideas' },
    { href: '/contact', label: 'Contact', key: 'contact' },
  ]

  return (
    <nav className="mt-4 flex gap-4 text-sm">
      {links.map(({ href, label, key }) => {
        const isActive = currentPage === key
        return (
          <a
            key={key}
            href={href}
            className={`transition-colors hover:underline ${isActive ? 'font-semibold' : ''}`}
            style={{ color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)' }}
          >
            {label}
          </a>
        )
      })}
    </nav>
  )
}
