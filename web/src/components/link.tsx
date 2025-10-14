import { clsx } from 'clsx'
import { forwardRef } from 'react'
import { navigateTo } from '../utils/router'

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, href, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      if (href && href !== '#') {
        navigateTo(href)
      }
      onClick?.(e)
    }

    return (
      <a
        ref={ref}
        href={href || '#'}
        onClick={handleClick}
        className={clsx(
          'text-gray-950 data-hover:text-gray-950/75 data-focus:text-gray-950/75',
          className
        )}
        {...props}
      />
    )
  }
)

Link.displayName = 'Link'
