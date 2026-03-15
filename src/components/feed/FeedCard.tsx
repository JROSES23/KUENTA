import { DollarSign, Users, CreditCard, UserPlus } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { formatCLP } from '../../utils/formatCLP'

interface FeedEvent {
  id: string
  type: 'expense_created' | 'payment_made' | 'payment_requested' | 'group_created' | 'member_joined'
  payload: Record<string, unknown>
  created_at: string
  actor?: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

interface FeedCardProps {
  event: FeedEvent
}

const ICONS = {
  expense_created: DollarSign,
  payment_made: CreditCard,
  payment_requested: DollarSign,
  group_created: Users,
  member_joined: UserPlus,
}

function getDescription(event: FeedEvent): string {
  const p = event.payload
  const actor = event.actor?.display_name ?? 'Alguien'

  switch (event.type) {
    case 'expense_created':
      return `${actor} agrego "${p.title}" por ${formatCLP(p.total_amount as number)}`
    case 'payment_made':
      return `${actor} pago ${formatCLP(p.amount as number)} a ${p.to_name}`
    case 'payment_requested':
      return `${actor} te pidio ${formatCLP(p.amount as number)}`
    case 'group_created':
      return `${actor} creo el grupo "${p.group_name}"`
    case 'member_joined':
      return `${actor} se unio al grupo`
    default:
      return ''
  }
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export function FeedCard({ event }: FeedCardProps) {
  const Icon = ICONS[event.type] ?? DollarSign
  const isPayment = event.type === 'payment_made'

  return (
    <Card>
      <div className="flex items-start gap-3">
        {event.actor ? (
          <Avatar name={event.actor.display_name} imageUrl={event.actor.avatar_url} size="sm" />
        ) : (
          <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center bg-[var(--purple-bg)]">
            <Icon size={16} strokeWidth={2} className="text-[var(--purple-text)]" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-ui text-body text-[var(--text)] leading-snug">
            {getDescription(event)}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-ui text-micro text-[var(--text-3)]">
              {getTimeAgo(event.created_at)}
            </span>
            {isPayment && <Badge variant="success">Pagado</Badge>}
          </div>
        </div>
      </div>
    </Card>
  )
}
