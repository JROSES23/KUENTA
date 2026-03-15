import { useEffect, useRef } from 'react'
import { cn } from '../../utils/cn'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function BottomSheet({ isOpen, onClose, children, className }: BottomSheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className={cn(
          'relative z-10 w-full max-w-[500px]',
          'bg-[var(--bg-2)] border border-[var(--border)]',
          'rounded-t-modal',
          'backdrop-blur-[16px]',
          'p-5 pb-8',
          'screen-enter',
          className
        )}
      >
        {/* Drag handle */}
        <div className="w-9 h-1 rounded-full bg-[var(--text-3)] mx-auto mb-5 opacity-40" />
        {children}
      </div>
    </div>
  )
}
