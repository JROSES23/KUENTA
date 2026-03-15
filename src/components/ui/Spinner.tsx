import { cn } from '../../utils/cn'

interface SpinnerProps {
  size?: number
  className?: string
}

export function Spinner({ size = 24, className }: SpinnerProps) {
  return (
    <div
      className={cn('animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary-2)]', className)}
      style={{ width: size, height: size }}
    />
  )
}
