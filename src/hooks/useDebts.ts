import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { DebtSummary, UserBalance } from '../types/app'

export function useDebts() {
  const { user } = useAuthStore()
  const [debts, setDebts] = useState<DebtSummary[]>([])
  const [balance, setBalance] = useState<UserBalance | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user) {
      setDebts([])
      setBalance(null)
      setIsLoading(false)
      return
    }
    loadDebts()
  }, [user?.id])

  async function loadDebts() {
    if (!user) return
    setIsLoading(true)

    try {
      const { data: balanceData, error: balanceError } = await supabase
        .rpc('get_user_balance', { p_user_id: user.id })
        .single()

      if (balanceError) throw new Error(balanceError.message)
      setBalance(balanceData as unknown as UserBalance)

      const { data: splits, error: splitsError } = await supabase
        .from('expense_splits')
        .select(`
          amount_owed,
          is_paid,
          user_id,
          expenses!inner(
            paid_by,
            title,
            group_id,
            paid_by_user:paid_by(id, display_name, avatar_url)
          )
        `)
        .eq('is_paid', false)
        .or(`user_id.eq.${user.id},expenses.paid_by.eq.${user.id}`)

      if (splitsError) throw new Error(splitsError.message)

      const debtMap = new Map<string, DebtSummary>()

      for (const split of (splits ?? [])) {
        const expense = split.expenses as Record<string, unknown>
        const isPayer = expense.paid_by === user.id
        const counterpartId = isPayer ? split.user_id : expense.paid_by as string
        const counterpartUser = isPayer
          ? null
          : expense.paid_by_user as { display_name: string; avatar_url: string | null } | null

        if (!counterpartId || counterpartId === user.id) continue

        const existing = debtMap.get(counterpartId) ?? {
          with_user_id: counterpartId,
          with_user_name: counterpartUser?.display_name ?? 'Usuario',
          with_user_avatar: counterpartUser?.avatar_url ?? null,
          net_amount: 0,
          expense_count: 0,
        }

        existing.net_amount += isPayer ? split.amount_owed : -split.amount_owed
        existing.expense_count += 1
        debtMap.set(counterpartId, existing)
      }

      setDebts(Array.from(debtMap.values()).sort((a, b) => Math.abs(b.net_amount) - Math.abs(a.net_amount)))
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  return { debts, balance, isLoading, error, refresh: loadDebts }
}
