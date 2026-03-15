import { useState, useEffect } from 'react'
import { ParticipantRow } from './ParticipantRow'
import { splitEqual, splitByPercent, splitByExact, splitByItems } from '../../utils/splitCalc'
import type { ItemAssignment } from '../../utils/splitCalc'
import type { ScannedItem } from '../../hooks/useScanReceipt'
import { formatCLP } from '../../utils/formatCLP'

export type SplitType = 'equal' | 'percent' | 'exact' | 'items'

export interface Participant {
  user_id: string
  display_name: string
  avatar_url: string | null
  selected: boolean
  percent?: number
  exactAmount?: number
}

interface SplitFormProps {
  totalAmount: number
  participants: Participant[]
  onParticipantsChange: (participants: Participant[]) => void
  onSplitsReady: (splits: { user_id: string; amount_owed: number }[]) => void
  onSplitTypeChange?: (type: SplitType) => void
  scannedItems?: ScannedItem[]
  initialSplitType?: SplitType
}

const SPLIT_TYPES: { id: SplitType; label: string }[] = [
  { id: 'equal', label: 'Igual' },
  { id: 'percent', label: '%' },
  { id: 'exact', label: 'Exacto' },
  { id: 'items', label: 'Por item' },
]

export function SplitForm({
  totalAmount,
  participants,
  onParticipantsChange,
  onSplitsReady,
  onSplitTypeChange,
  scannedItems,
  initialSplitType,
}: SplitFormProps) {
  const [splitType, setSplitType] = useState<SplitType>(initialSplitType ?? 'equal')
  // For items mode: track which users are assigned to each item
  const [itemAssignments, setItemAssignments] = useState<ItemAssignment[]>([])

  // Initialize item assignments when scannedItems change
  useEffect(() => {
    if (scannedItems?.length) {
      setItemAssignments(
        scannedItems.map((item, i) => ({
          itemIndex: i,
          name: item.name,
          total_price: item.total_price,
          assigned_to: [], // unassigned by default
        }))
      )
    }
  }, [scannedItems])

  const selected = participants.filter(p => p.selected)
  const splitsTotal = computeSplitsTotal()

  function computeSplitsTotal(): number {
    if (splitType === 'exact') {
      return selected.reduce((s, p) => s + (p.exactAmount ?? 0), 0)
    }
    if (splitType === 'percent') {
      return selected.reduce((s, p) => s + (p.percent ?? 0), 0)
    }
    if (splitType === 'items') {
      return itemAssignments
        .filter(a => a.assigned_to.length > 0)
        .reduce((s, a) => s + a.total_price, 0)
    }
    return totalAmount
  }

  function toggleParticipant(userId: string) {
    const updated = participants.map(p =>
      p.user_id === userId ? { ...p, selected: !p.selected } : p
    )
    onParticipantsChange(updated)
    recalculate(updated, splitType)
  }

  function updatePercent(userId: string, percent: number) {
    const updated = participants.map(p =>
      p.user_id === userId ? { ...p, percent } : p
    )
    onParticipantsChange(updated)
    recalculate(updated, 'percent')
  }

  function updateExact(userId: string, amount: number) {
    const updated = participants.map(p =>
      p.user_id === userId ? { ...p, exactAmount: amount } : p
    )
    onParticipantsChange(updated)
    recalculate(updated, 'exact')
  }

  function toggleItemAssignment(itemIndex: number, userId: string) {
    const updated = itemAssignments.map(a => {
      if (a.itemIndex !== itemIndex) return a
      const has = a.assigned_to.includes(userId)
      return {
        ...a,
        assigned_to: has
          ? a.assigned_to.filter(id => id !== userId)
          : [...a.assigned_to, userId],
      }
    })
    setItemAssignments(updated)
    // Recalculate splits from items
    try {
      const splits = splitByItems(updated)
      onSplitsReady(splits)
    } catch {
      // Still editing
    }
  }

  function recalculate(parts: Participant[], type: SplitType) {
    const sel = parts.filter(p => p.selected)
    if (!sel.length || !totalAmount) return

    try {
      let splits: { user_id: string; amount_owed: number }[]
      switch (type) {
        case 'equal':
          splits = splitEqual(totalAmount, sel.map(p => p.user_id))
          break
        case 'percent':
          splits = splitByPercent(totalAmount, sel.map(p => ({
            user_id: p.user_id,
            percent: p.percent ?? Math.floor(100 / sel.length),
          })))
          break
        case 'exact':
          splits = splitByExact(totalAmount, sel.map(p => ({
            user_id: p.user_id,
            amount: p.exactAmount ?? 0,
          })))
          break
        case 'items':
          splits = splitByItems(itemAssignments)
          break
      }
      onSplitsReady(splits)
    } catch {
      // Validation error — user still editing
    }
  }

  function handleSplitTypeChange(type: SplitType) {
    setSplitType(type)
    onSplitTypeChange?.(type)
    recalculate(participants, type)
  }

  // Filter: only show 'items' pill if scannedItems exist
  const availableTypes = scannedItems?.length
    ? SPLIT_TYPES
    : SPLIT_TYPES.filter(t => t.id !== 'items')

  return (
    <div>
      {/* Split type pills */}
      <div className="flex gap-2 mb-4">
        {availableTypes.map(t => (
          <button
            key={t.id}
            onClick={() => handleSplitTypeChange(t.id)}
            className={`px-4 py-2 rounded-pill font-ui text-body-sm transition-colors ${
              splitType === t.id
                ? 'bg-[var(--purple-bg)] text-[var(--purple-text)] font-semibold'
                : 'bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Items mode */}
      {splitType === 'items' && scannedItems?.length ? (
        <div>
          <p className="font-ui text-caption uppercase text-[var(--text-3)] tracking-[0.8px] mb-2">
            Asigna cada item a quien lo consumio
          </p>
          {itemAssignments.map((item) => (
            <div key={item.itemIndex} className="mb-3 p-3 rounded-card bg-[var(--surface)] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-ui text-body text-[var(--text)] truncate flex-1">{item.name}</span>
                <span className="font-ui text-title text-[var(--text)] ml-2">{formatCLP(item.total_price)}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {participants.map(p => {
                  const isAssigned = item.assigned_to.includes(p.user_id)
                  return (
                    <button
                      key={p.user_id}
                      onClick={() => toggleItemAssignment(item.itemIndex, p.user_id)}
                      className={`px-2.5 py-1 rounded-pill font-ui text-micro transition-colors ${
                        isAssigned
                          ? 'bg-[var(--purple-bg)] text-[var(--purple-text)] font-semibold'
                          : 'bg-[var(--bg)] text-[var(--text-3)] border border-[var(--border)]'
                      }`}
                    >
                      {p.display_name.split(' ')[0]}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Items total validation */}
          <div className="flex items-center justify-between py-2 mt-2">
            <span className="font-ui text-body-sm text-[var(--text-3)]">Asignado</span>
            <span className={`font-ui text-title ${
              splitsTotal === totalAmount ? 'text-[var(--green)]' : 'text-[var(--red)]'
            }`}>
              {formatCLP(splitsTotal)} / {formatCLP(totalAmount)}
            </span>
          </div>
        </div>
      ) : (
        /* Participants list for equal/percent/exact modes */
        <div>
          {participants.map(p => (
            <ParticipantRow
              key={p.user_id}
              name={p.display_name}
              avatarUrl={p.avatar_url}
              selected={p.selected}
              splitType={splitType === 'items' ? 'equal' : splitType}
              amount={
                splitType === 'equal' && p.selected && selected.length > 0
                  ? Math.floor(totalAmount / selected.length)
                  : splitType === 'exact' ? (p.exactAmount ?? 0) : undefined
              }
              percent={p.percent}
              onToggle={() => toggleParticipant(p.user_id)}
              onPercentChange={(v) => updatePercent(p.user_id, v)}
              onExactChange={(v) => updateExact(p.user_id, v)}
            />
          ))}

          {/* Validation info */}
          {splitType === 'exact' && selected.length > 0 && (
            <div className="flex items-center justify-between py-2 mt-2">
              <span className="font-ui text-body-sm text-[var(--text-3)]">Suma</span>
              <span className={`font-ui text-title ${
                splitsTotal === totalAmount ? 'text-[var(--green)]' : 'text-[var(--red)]'
              }`}>
                {formatCLP(splitsTotal)} / {formatCLP(totalAmount)}
              </span>
            </div>
          )}
          {splitType === 'percent' && selected.length > 0 && (
            <div className="flex items-center justify-between py-2 mt-2">
              <span className="font-ui text-body-sm text-[var(--text-3)]">Total %</span>
              <span className={`font-ui text-title ${
                splitsTotal === 100 ? 'text-[var(--green)]' : 'text-[var(--red)]'
              }`}>
                {splitsTotal}% / 100%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
