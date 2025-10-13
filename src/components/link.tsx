import { clsx } from 'clsx'
import { forwardRef } from 'react'

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, href, ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={href || '#'}
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
