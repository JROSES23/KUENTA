import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { DebtSummary, UserBalance } from '../types/app'

export function useDebts() {
  const userId = useAuthStore((s) => s.user?.id)
  const [debts, setDebts] = useState<DebtSummary[]>([])
  const [balance, setBalance] = useState<UserBalance | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadDebts = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)

    try {
      // Balance via RPC — non-blocking if function doesn't exist
      try {
        const { data: balanceData, error: balanceError } = await supabase
          .rpc('get_user_balance', { p_user_id: userId })
          .single()

        if (!balanceError) setBalance(balanceData as unknown as UserBalance)
      } catch {
        // RPC may not exist yet
      }

      // Query 1: What I owe others (splits where I'm the debtor)
      const { data: iOwe, error: iOweErr } = await supabase
        .from('expense_splits')
        .select(`
          amount_owed,
          expense_id,
          expenses!inner (
            paid_by,
            title,
            group_id
          )
        `)
        .eq('user_id', userId)
        .eq('is_paid', false)

      if (iOweErr) throw new Error(iOweErr.message)

      // Query 2: What others owe me (splits on expenses I paid)
      const { data: owedToMe, error: owedErr } = await supabase
        .from('expense_splits')
        .select(`
          amount_owed,
          user_id,
          expense_id,
          expenses!inner (
            paid_by,
            title,
            group_id
          )
        `)
        .eq('expenses.paid_by', userId)
        .eq('is_paid', false)
        .neq('user_id', userId)

      if (owedErr) throw new Error(owedErr.message)

      // Build debt map
      const debtMap = new Map<string, DebtSummary>()

      // I owe these people
      for (const split of (iOwe ?? [])) {
        const expense = split.expenses as Record<string, unknown>
        const payerId = expense.paid_by as string
        if (!payerId || payerId === userId) continue

        const existing = debtMap.get(payerId) ?? {
          with_user_id: payerId,
          with_user_name: 'Usuario',
          with_user_avatar: null,
          net_amount: 0,
          expense_count: 0,
        }

        existing.net_amount -= split.amount_owed
        existing.expense_count += 1
        debtMap.set(payerId, existing)
      }

      // These people owe me
      for (const split of (owedToMe ?? [])) {
        const debtorId = split.user_id
        if (!debtorId || debtorId === userId) continue

        const existing = debtMap.get(debtorId) ?? {
          with_user_id: debtorId,
          with_user_name: 'Usuario',
          with_user_avatar: null,
          net_amount: 0,
          expense_count: 0,
        }

        existing.net_amount += split.amount_owed
        existing.expense_count += 1
        debtMap.set(debtorId, existing)
      }

      // Fetch display names for all counterparts
      const counterpartIds = Array.from(debtMap.keys())
      if (counterpartIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, display_name, avatar_url')
          .in('id', counterpartIds)

        for (const u of (users ?? [])) {
          const debt = debtMap.get(u.id)
          if (debt) {
            debt.with_user_name = u.display_name || 'Usuario'
            debt.with_user_avatar = u.avatar_url
          }
        }
      }

      setDebts(Array.from(debtMap.values()).sort((a, b) => Math.abs(b.net_amount) - Math.abs(a.net_amount)))
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setDebts([])
      setBalance(null)
      setIsLoading(false)
      return
    }

    loadDebts()
  }, [userId, loadDebts])

  return { debts, balance, isLoading, error, refresh: loadDebts }
}
