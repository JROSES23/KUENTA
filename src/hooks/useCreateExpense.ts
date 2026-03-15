import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Json } from '../types/database'

interface CreateExpenseParams {
  group_id: string
  title: string
  total_amount: number
  split_type: 'equal' | 'percent' | 'exact' | 'items'
  splits: { user_id: string; amount_owed: number }[]
  receipt_url?: string
  receipt_items?: Json
  notes?: string
}

export function useCreateExpense() {
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  async function createExpense(params: CreateExpenseParams): Promise<string> {
    if (!user) throw new Error('No autenticado')
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: err } = await supabase.rpc('create_expense_with_splits', {
        p_group_id: params.group_id,
        p_paid_by: user.id,
        p_title: params.title,
        p_total: params.total_amount,
        p_split_type: params.split_type,
        p_splits: params.splits as unknown as Json,
        p_receipt_url: params.receipt_url ?? null,
        p_receipt_items: (params.receipt_items ?? null) as Json | null,
        p_notes: params.notes ?? null,
      })

      if (err) throw new Error(err.message)
      return data as string
    } catch (err) {
      const e = err as Error
      setError(e)
      throw e
    } finally {
      setIsLoading(false)
    }
  }

  return { createExpense, isLoading, error }
}
