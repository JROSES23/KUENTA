import { Check } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { formatCLP } from '../../utils/formatCLP'

interface ParticipantRowProps {
  name: string
  avatarUrl: string | null
  selected: boolean
  splitType: 'equal' | 'percent' | 'exact'
  amount?: number
  percent?: number
  onToggle: () => void
  onPercentChange?: (value: number) => void
  onExactChange?: (value: number) => void
}

export function ParticipantRow({
  name,
  avatarUrl,
  selected,
  splitType,
  amount,
  percent,
  onToggle,
  onPercentChange,
  onExactChange,
}: ParticipantRowProps) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors flex-shrink-0 ${
          selected
            ? 'bg-[var(--purple-bg)] border-[var(--border-2)]'
            : 'bg-transparent border-[var(--border)]'
        }`}
      >
        {selected && <Check size={14} strokeWidth={2.5} className="text-[var(--purple-text)]" />}
      </button>

      <Avatar name={name} imageUrl={avatarUrl} size="sm" />

      <span className="flex-1 font-ui text-body text-[var(--text)] truncate">{name}</span>

      {/* Amount display / input */}
      {selected && splitType === 'equal' && amount !== undefined && (
        <span className="font-ui text-title text-[var(--text-2)]">{formatCLP(amount)}</span>
      )}

      {selected && splitType === 'percent' && (
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={100}
            value={percent ?? ''}
            onChange={e => onPercentChange?.(Number(e.target.value))}
            className="w-14 text-right py-1 px-2 font-ui text-body bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text)] focus:outline-none focus:border-[var(--border-2)]"
          />
          <span className="font-ui text-body-sm text-[var(--text-3)]">%</span>
        </div>
      )}

      {selected && splitType === 'exact' && (
        <div className="flex items-center gap-1">
          <span className="font-ui text-body-sm text-[var(--text-3)]">$</span>
          <input
            type="number"
            min={0}
            value={amount ?? ''}
            onChange={e => onExactChange?.(Number(e.target.value))}
            className="w-20 text-right py-1 px-2 font-ui text-body bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--text)] focus:outline-none focus:border-[var(--border-2)]"
          />
        </div>
      )}
    </div>
  )
}
