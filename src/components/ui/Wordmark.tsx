import { cn } from '../../utils/cn'

interface WordmarkProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'text-[22px] tracking-[6px]',
  md: 'text-[28px] tracking-[8px]',
  lg: 'text-[42px] tracking-[12px]',
}

export function Wordmark({ size = 'md', className }: WordmarkProps) {
  return (
    <span
      className={cn(
        'font-brand font-extrabold uppercase select-none',
        'bg-gradient-to-br from-[#8880DE] via-[#4C44AA] to-[#6860C8]',
        'bg-clip-text text-transparent',
        '[filter:drop-shadow(0_0_16px_rgba(136,128,222,0.45))]',
        sizes[size],
        className
      )}
    >
      K U E N T A
    </span>
  )
}
