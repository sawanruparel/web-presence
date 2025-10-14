import { clsx } from 'clsx'
import { forwardRef } from 'react'

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Logo = forwardRef<HTMLDivElement, LogoProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'flex items-center gap-3',
          className
        )}
        {...props}
      >
        <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center border-2 border-black">
          <span className="text-lg font-bold text-black">S</span>
        </div>
        <span className="text-xl font-bold text-white">Sawan Ruparel</span>
      </div>
    )
  }
)

Logo.displayName = 'Logo'
