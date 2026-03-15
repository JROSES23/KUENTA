import { cn } from '../../utils/cn'

interface BadgeProps {
  variant?: 'success' | 'error' | 'neutral'
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-pill font-ui text-micro',
        variant === 'success' && 'bg-[var(--green-bg)] text-[var(--green)]',
        variant === 'error' && 'bg-[var(--red-bg)] text-[var(--red)]',
        variant === 'neutral' && 'bg-[var(--purple-bg)] text-[var(--purple-text)]',
        className
      )}
    >
      {children}
    </span>
  )
}
