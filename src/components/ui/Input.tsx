import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  prefix?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ prefix, className, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {prefix && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[var(--text-2)] text-body pointer-events-none">
            {prefix}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full py-[13px] px-3.5 font-ui text-body',
            'bg-[var(--input-bg)] text-[var(--text)]',
            'border border-[var(--input-border)] rounded-input',
            'placeholder:text-[var(--text-3)]',
            'focus:border-[var(--border-2)] focus:bg-[var(--surface)] focus:outline-none',
            'transition-colors',
            !!prefix && 'pl-[72px]',
            className
          )}
          {...props}
        />
      </div>
    )
  }
)

Input.displayName = 'Input'
