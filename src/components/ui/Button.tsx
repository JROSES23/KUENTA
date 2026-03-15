import { cn } from '../../utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'social'
  children: React.ReactNode
}

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'w-full flex items-center justify-center gap-2 font-ui font-bold text-[15px] transition-transform active:scale-[0.98]',
        variant === 'primary' && [
          'py-4 rounded-btn text-white',
          'bg-gradient-to-br from-[#4C44AA] to-[#6860C8]',
          'shadow-[0_6px_24px_rgba(76,68,170,0.4)]',
        ].join(' '),
        variant === 'ghost' && [
          'py-3 rounded-btn',
          'text-[var(--text)] bg-transparent',
          'border border-[var(--border)]',
        ].join(' '),
        variant === 'social' && [
          'py-3 rounded-btn',
          'text-[var(--text)] bg-[var(--surface)]',
          'border border-[var(--border)]',
          'backdrop-blur-[16px]',
          'font-medium text-[14px]',
        ].join(' '),
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
