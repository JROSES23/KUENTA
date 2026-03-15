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
      const { data: balanceData, error: balanceError } = await supabase
        .rpc('get_user_balance', { p_user_id: userId })
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
        .or(`user_id.eq.${userId},expenses.paid_by.eq.${userId}`)

      if (splitsError) throw new Error(splitsError.message)

      const debtMap = new Map<string, DebtSummary>()

      for (const split of (splits ?? [])) {
        const expense = split.expenses as Record<string, unknown>
        const isPayer: boolean = expense.paid_by === userId
        const counterpartId: string = isPayer ? split.user_id : expense.paid_by as string
        const counterpartUser = isPayer
          ? null
          : expense.paid_by_user as { display_name: string; avatar_url: string | null } | null

        if (!counterpartId || counterpartId === userId) continue

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
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setDebts([])
      setBalance(null)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    // Use the same logic but with cancellation
    Promise.resolve().then(async () => {
      try {
        const { data: balanceData, error: balanceError } = await supabase
          .rpc('get_user_balance', { p_user_id: userId })
          .single()

        if (cancelled) return
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
          .or(`user_id.eq.${userId},expenses.paid_by.eq.${userId}`)

        if (cancelled) return
        if (splitsError) throw new Error(splitsError.message)

        const debtMap = new Map<string, DebtSummary>()

        for (const split of (splits ?? [])) {
          const expense = split.expenses as Record<string, unknown>
          const payer: boolean = expense.paid_by === userId
          const cId: string = payer ? split.user_id : expense.paid_by as string
          const counterpartUser = payer
            ? null
            : expense.paid_by_user as { display_name: string; avatar_url: string | null } | null

          if (!cId || cId === userId) continue

          const existing = debtMap.get(cId) ?? {
            with_user_id: cId,
            with_user_name: counterpartUser?.display_name ?? 'Usuario',
            with_user_avatar: counterpartUser?.avatar_url ?? null,
            net_amount: 0,
            expense_count: 0,
          }

          existing.net_amount += payer ? split.amount_owed : -split.amount_owed
          existing.expense_count += 1
          debtMap.set(cId, existing)
        }

        if (cancelled) return
        setDebts(Array.from(debtMap.values()).sort((a, b) => Math.abs(b.net_amount) - Math.abs(a.net_amount)))
      } catch (err) {
        if (!cancelled) setError(err as Error)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [userId])

  return { debts, balance, isLoading, error, refresh: loadDebts }
}
