import { Link } from './link'

interface PageNavigationProps {
  currentPage?: string
}

export function PageNavigation({ currentPage }: PageNavigationProps) {
  const links = [
    { href: '/about', label: 'About', key: 'about' },
    { href: '/start-here', label: 'Start Here', key: 'start-here' },
    { href: '/notes', label: 'Systems Playbook', key: 'notes' },
    { href: '/publications', label: 'Publications', key: 'publications' },
    { href: '/ideas', label: 'Ideas', key: 'ideas' },
    { href: '/contact', label: 'Contact', key: 'contact' },
  ]

  return (
    <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
      {links.map(({ href, label, key }) => {
        const isActive = currentPage === key
        return (
          <Link
            key={key}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`transition-colors hover:underline ${isActive ? 'font-semibold' : ''}`}
            style={{ color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)' }}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
