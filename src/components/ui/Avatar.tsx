import { cn } from '../../utils/cn'
import { getAvatarColor } from '../../utils/avatarColor'

interface AvatarProps {
  name: string
  imageUrl?: string | null
  size?: 'sm' | 'md'
  className?: string
}

export function Avatar({ name, imageUrl, size = 'md', className }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const color = getAvatarColor(name)
  const sizeClass = size === 'sm' ? 'w-[34px] h-[34px] text-[11px]' : 'w-10 h-10 text-[13px]'

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={cn(
          'rounded-full object-cover border border-[var(--border)]',
          sizeClass,
          className
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-ui font-bold border border-[var(--border)]',
        sizeClass,
        className
      )}
      style={{ backgroundColor: color.bg, color: color.text }}
    >
      {initials}
    </div>
  )
}
