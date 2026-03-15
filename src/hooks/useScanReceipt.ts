import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { usePlan } from './usePlan'

export interface ScannedItem {
  name: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface ScanResult {
  store: string
  date: string | null
  total: number
  items: ScannedItem[]
}

export function useScanReceipt() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { canScanReceipt } = usePlan()

  async function scanReceipt(imageFile: File): Promise<ScanResult> {
    if (!canScanReceipt(0)) {
      throw new Error('Has alcanzado el limite de scans de tu plan. Actualiza a Premium.')
    }

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', imageFile)

      const { data, error } = await supabase.functions.invoke('scan-receipt', {
        body: formData,
      })

      if (error) throw new Error(error.message)
      return data as ScanResult
    } catch (err) {
      const e = err as Error
      setError(e)
      throw e
    } finally {
      setIsLoading(false)
    }
  }

  return { scanReceipt, isLoading, error }
}
