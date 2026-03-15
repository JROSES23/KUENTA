import { ArrowRight } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { formatCLP } from '../../utils/formatCLP'

interface DebtRowProps {
  userName: string
  avatarUrl?: string | null
  amount: number // positive = they owe you, negative = you owe
  expenseCount: number
  onPay?: () => void
  onRemind?: () => void
}

export function DebtRow({ userName, avatarUrl, amount, expenseCount, onPay }: DebtRowProps) {
  const isPositive = amount > 0
  const colorClass = isPositive ? 'text-[var(--green)]' : 'text-[var(--red)]'
  const label = isPositive ? 'te debe' : 'debes'

  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--border)] last:border-0">
      <Avatar name={userName} imageUrl={avatarUrl} />

      <div className="flex-1 min-w-0">
        <p className="font-ui text-title text-[var(--text)] truncate">{userName}</p>
        <p className="font-ui text-body-sm text-[var(--text-2)]">
          {expenseCount} {expenseCount === 1 ? 'gasto' : 'gastos'} &middot; {label}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className={`font-ui text-title ${colorClass}`}>
          {formatCLP(Math.abs(amount))}
        </span>
        {!isPositive && onPay && (
          <button
            onClick={onPay}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--purple-bg)] active:scale-90 transition-transform"
          >
            <ArrowRight size={14} strokeWidth={2.5} className="text-[var(--purple-text)]" />
          </button>
        )}
      </div>
    </div>
  )
}
