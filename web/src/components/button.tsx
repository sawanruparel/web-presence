import { clsx } from 'clsx'
import { forwardRef } from 'react'
import { Link } from './link.tsx'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  href?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', href, children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-full px-6 py-3 text-base font-medium transition-colors'
    
    const variantClasses = {
      primary: 'bg-gray-950 text-white data-hover:bg-gray-950/90',
      secondary: 'bg-white text-gray-950 ring-1 ring-gray-950/10 data-hover:bg-gray-950/5'
    }

    if (href) {
      return (
        <Link
          href={href}
          className={clsx(
            baseClasses,
            variantClasses[variant],
            className
          )}
        >
          {children}
        </Link>
      )
    }

    return (
      <button
        ref={ref}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
