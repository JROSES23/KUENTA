import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { SplitForm } from '../../components/expenses/SplitForm'
import type { SplitType, Participant } from '../../components/expenses/SplitForm'
import { useGroups } from '../../hooks/useGroups'
import { useCreateExpense } from '../../hooks/useCreateExpense'
import { useGroupDetail } from '../../hooks/useGroupDetail'
import { formatCLP, formatCLPNumber } from '../../utils/formatCLP'
import type { ScanResult } from '../../hooks/useScanReceipt'

interface LocationState {
  fromScan?: boolean
  scanResult?: ScanResult
}

export default function NewExpensePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as LocationState) ?? {}
  const { groups } = useGroups()
  const { createExpense, isLoading } = useCreateExpense()

  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [title, setTitle] = useState(state.scanResult?.store ?? '')
  const [amountStr, setAmountStr] = useState(
    state.scanResult ? String(state.scanResult.total) : ''
  )
  const [splitType, setSplitType] = useState<SplitType>(
    state.fromScan ? 'items' : 'equal'
  )
  const [participants, setParticipants] = useState<Participant[]>([])
  const [splits, setSplits] = useState<{ user_id: string; amount_owed: number }[]>([])
  const [error, setError] = useState('')

  const amount = parseInt(amountStr.replace(/\D/g, ''), 10) || 0

  // Load group members when group is selected
  const { detail: groupDetail } = useGroupDetail(selectedGroupId)

  useEffect(() => {
    if (!groupDetail?.members) return
    setParticipants(
      groupDetail.members
        .filter(m => m.user_id) // only registered users can be in splits
        .map(m => ({
          user_id: m.user_id!,
          display_name: m.user?.display_name ?? m.guest_name ?? 'Usuario',
          avatar_url: m.user?.avatar_url ?? null,
          selected: true,
        }))
    )
  }, [groupDetail?.members])

  async function handleSubmit() {
    if (!selectedGroupId) { setError('Selecciona un grupo'); return }
    if (!title.trim()) { setError('Agrega un titulo'); return }
    if (amount <= 0) { setError('Agrega un monto'); return }
    if (splits.length === 0) { setError('Selecciona participantes'); return }

    // Validate splits sum matches total
    const splitsSum = splits.reduce((s, sp) => s + sp.amount_owed, 0)
    if (splitsSum !== amount) {
      setError(`Los montos no suman el total: ${formatCLP(splitsSum)} vs ${formatCLP(amount)}`)
      return
    }

    // Ensure all amounts are integers
    const intSplits = splits.map(s => ({
      user_id: s.user_id,
      amount_owed: Math.round(s.amount_owed),
    }))

    setError('')
    try {
      await createExpense({
        group_id: selectedGroupId,
        title: title.trim(),
        total_amount: amount,
        split_type: splitType,
        splits: intSplits,
        receipt_items: state.scanResult ? state.scanResult.items as unknown as import('../../types/database').Json : undefined,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg)]">
      {/* Header */}
      <div
        className="relative overflow-hidden px-[22px] pt-[52px] pb-6"
        style={{ background: 'var(--header-gradient)' }}
      >
        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 border border-white/15"
          >
            <ChevronLeft size={14} strokeWidth={2.5} className="text-white" />
          </button>
          <h3 className="font-ui text-h3 text-white">
            {state.fromScan ? 'Split de boleta' : 'Nuevo gasto'}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-6" style={{ scrollbarWidth: 'none' }}>
        {/* Amount display */}
        <div className="text-center mb-6">
          <p className="font-ui text-caption uppercase text-[var(--text-3)] tracking-[0.8px] mb-2">Monto total</p>
          <div className="flex items-center justify-center gap-1">
            <span className="font-ui text-h2 text-[var(--text-3)]">$</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={amountStr ? formatCLPNumber(amount) : ''}
              onChange={e => setAmountStr(e.target.value)}
              className="font-ui text-display text-[var(--text)] bg-transparent text-center outline-none w-48"
              autoFocus={!state.fromScan}
            />
          </div>
        </div>

        {/* Title */}
        <label className="font-ui text-caption uppercase text-[var(--text-3)] mb-2 tracking-[0.8px] block">
          Titulo
        </label>
        <Input
          placeholder="Ej: Almuerzo, Uber, Supermercado"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={60}
          className="mb-4"
        />

        {/* Group selector */}
        <label className="font-ui text-caption uppercase text-[var(--text-3)] mb-2 tracking-[0.8px] block">
          Grupo
        </label>
        <select
          value={selectedGroupId}
          onChange={e => setSelectedGroupId(e.target.value)}
          className="w-full py-[13px] px-3.5 font-ui text-body bg-[var(--input-bg)] text-[var(--text)] border border-[var(--input-border)] rounded-input focus:outline-none focus:border-[var(--border-2)] mb-4 appearance-none"
        >
          <option value="">Seleccionar grupo</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>

        {/* Split form */}
        {selectedGroupId && amount > 0 && participants.length > 0 && (
          <>
            <label className="font-ui text-caption uppercase text-[var(--text-3)] mb-2 tracking-[0.8px] block">
              Division
            </label>
            <SplitForm
              totalAmount={amount}
              participants={participants}
              onParticipantsChange={setParticipants}
              onSplitsReady={setSplits}
              onSplitTypeChange={setSplitType}
              scannedItems={state.scanResult?.items}
              initialSplitType={state.fromScan ? 'items' : 'equal'}
            />
          </>
        )}

        {error && (
          <p className="font-ui text-body-sm text-[var(--red)] mt-2 mb-2">{error}</p>
        )}

        <div className="mt-6">
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Spinner size={20} className="border-white/30 border-t-white" /> : 'Crear split'}
          </Button>
        </div>
      </div>
    </div>
  )
}
