interface PageNavigationProps {
  currentPage?: string
}

export function PageNavigation({ currentPage }: PageNavigationProps) {
  const links = [
    { href: '/', label: 'About', key: 'about' },
    { href: '/notes', label: 'Notes', key: 'notes' },
    { href: '/publications', label: 'Publications', key: 'publications' },
    { href: '/ideas', label: 'Ideas', key: 'ideas' },
    { href: '/contact', label: 'Contact', key: 'contact' },
  ]

  return (
    <nav className="mt-4 flex gap-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
      {links.map(({ href, label, key }) => (
        <a 
          key={key}
          href={href} 
          className={`hover:underline ${currentPage === key ? 'font-semibold' : ''}`}
        >
          {label}
        </a>
      ))}
    </nav>
  )
}
