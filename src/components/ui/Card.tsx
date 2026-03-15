import { cn } from '../../utils/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--surface)] border border-[var(--border)] rounded-card',
        'shadow-[var(--card-shadow)] backdrop-blur-[16px]',
        'p-3.5 mb-2',
        'active:scale-[0.99] transition-transform',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
