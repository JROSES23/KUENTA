import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface PaymentResult {
  payment_url: string
  payment_id: string
}

export function useKhipuPayment() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  async function createPayment(params: {
    expense_id: string
    amount: number
    subject: string
  }): Promise<PaymentResult> {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.functions.invoke('create-khipu-payment', {
        body: params,
      })

      if (error) throw new Error(error.message)
      if (!data?.payment_url) throw new Error('No se recibio URL de pago')

      return data as PaymentResult
    } catch (err) {
      const e = err as Error
      setError(e)
      throw e
    } finally {
      setIsLoading(false)
    }
  }

  function openPayment(paymentUrl: string) {
    window.open(paymentUrl, '_blank', 'noopener,noreferrer')
  }

  return { createPayment, openPayment, isLoading, error }
}
