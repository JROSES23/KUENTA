import { formatCLP } from '../../utils/formatCLP'

interface ReceiptItemRowProps {
  name: string
  price: number
  assignedTo: string
  onAssign: () => void
}

export function ReceiptItemRow({ name, price, assignedTo, onAssign }: ReceiptItemRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--border)] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-ui text-body text-[var(--text)] truncate">{name}</p>
      </div>
      <span className="font-ui text-title text-[var(--text)] flex-shrink-0">
        {formatCLP(price)}
      </span>
      <button
        onClick={onAssign}
        className="px-3 py-1.5 rounded-pill font-ui text-micro bg-[var(--purple-bg)] text-[var(--purple-text)] active:scale-95 transition-transform flex-shrink-0"
      >
        {assignedTo === 'all' ? 'Todos' : assignedTo}
      </button>
    </div>
  )
}
