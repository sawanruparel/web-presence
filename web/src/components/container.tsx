import { clsx } from 'clsx'
import { forwardRef } from 'react'

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'mx-auto max-w-7xl px-6 lg:px-8',
          className
        )}
        {...props}
      />
    )
  }
)

Container.displayName = 'Container'
