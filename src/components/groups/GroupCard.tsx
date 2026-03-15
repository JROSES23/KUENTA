import { Users } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { formatCLP } from '../../utils/formatCLP'

interface GroupCardProps {
  id: string
  name: string
  memberCount: number
  balance?: number
  onClick: () => void
}

export function GroupCard({ name, memberCount, balance, onClick }: GroupCardProps) {
  return (
    <Card onClick={onClick}>
      <div className="flex items-center gap-3">
        {/* Group icon */}
        <div className="w-10 h-10 rounded-icon flex items-center justify-center bg-[var(--purple-bg)] flex-shrink-0">
          <Users size={18} strokeWidth={2} className="text-[var(--purple-text)]" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-ui text-title text-[var(--text)] truncate">{name}</p>
          <p className="font-ui text-body-sm text-[var(--text-2)]">
            {memberCount} {memberCount === 1 ? 'persona' : 'personas'}
          </p>
        </div>

        {/* Balance badge */}
        {balance !== undefined && balance !== 0 && (
          <Badge variant={balance > 0 ? 'success' : 'error'}>
            {balance > 0 ? '+' : ''}{formatCLP(balance)}
          </Badge>
        )}
      </div>
    </Card>
  )
}
