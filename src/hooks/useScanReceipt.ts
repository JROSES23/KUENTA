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

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Strip the data:image/...;base64, prefix
        resolve(result.split(',')[1])
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function scanReceipt(imageFile: File): Promise<ScanResult> {
    if (!canScanReceipt(0)) {
      throw new Error('Has alcanzado el limite de scans de tu plan. Actualiza a Premium.')
    }

    setIsLoading(true)
    setError(null)

    try {
      const image = await fileToBase64(imageFile)
      console.log('[scan] base64 length:', image.length, 'mimeType:', imageFile.type)

      const { data, error: fnError } = await supabase.functions.invoke('scan-receipt', {
        body: { image, mimeType: imageFile.type || 'image/jpeg' },
      })

      console.log('[scan] response data:', data, 'error:', fnError)

      if (fnError) {
        // FunctionsHttpError has a context with the response
        const msg = fnError.message || 'Error desconocido'
        console.error('[scan] function error:', fnError)
        throw new Error(msg)
      }

      if (!data || data.error) {
        throw new Error(data?.error || 'Respuesta vacia de la funcion')
      }

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
