import { useState } from 'react'

export interface ScannedItem {
  name: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface ScanResult {
  store: string | null
  date: string | null
  total: number
  items: ScannedItem[]
}

// ── Provider config ──────────────────────────────────────────
// MVP: swap provider here when ready for Gemini direct billing
type Provider = 'openrouter' | 'gemini'

const PROVIDER: Provider = import.meta.env.VITE_GEMINI_API_KEY ? 'gemini' : 'openrouter'

const RECEIPT_PROMPT = `Eres un extractor de datos de boletas y tickets chilenos.
Analiza esta imagen con mucho cuidado y extrae TODOS los productos comprados.

Responde UNICAMENTE con JSON valido, sin texto adicional, sin markdown, sin bloques de codigo:
{
  "store": "nombre del local o null",
  "date": "DD/MM/YYYY o null",
  "total": 16910,
  "items": [
    {
      "name": "nombre completo del producto",
      "quantity": 1,
      "unit_price": 2490,
      "total_price": 2490
    }
  ]
}

Reglas estrictas:
- Todos los montos deben ser numeros enteros en pesos chilenos (CLP)
- Sin simbolos $ ni puntos de miles — solo el numero: 2490 no $2.490
- Incluye ABSOLUTAMENTE TODOS los productos, sin omitir ninguno
- Si hay descuentos, incluyelos como item con precio negativo
- Si no puedes leer un valor con certeza usa null
- quantity siempre debe ser un numero entero positivo
- El total debe coincidir con la suma de todos los total_price`

// ── API calls ────────────────────────────────────────────────

async function callOpenRouter(base64: string, mimeType: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
  if (!apiKey) throw new Error('VITE_OPENROUTER_API_KEY no configurada')

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-exp:free',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: RECEIPT_PROMPT },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64}` },
          },
        ],
      }],
      temperature: 0.1,
      max_tokens: 4096,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `OpenRouter error ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}

async function callGemini(base64: string, mimeType: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY no configurada')

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: RECEIPT_PROMPT },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      }),
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `Gemini error ${response.status}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

// ── Hook ─────────────────────────────────────────────────────

export function useScanReceipt() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  async function scanReceipt(file: File): Promise<ScanResult> {
    setIsLoading(true)
    setError(null)

    try {
      // Convert image to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const mimeType = file.type || 'image/jpeg'

      // Call the active provider
      const rawText = PROVIDER === 'gemini'
        ? await callGemini(base64, mimeType)
        : await callOpenRouter(base64, mimeType)

      if (!rawText) throw new Error('No se recibio respuesta del modelo')

      // Clean markdown if present
      const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed: ScanResult = JSON.parse(clean)

      if (!parsed.items || parsed.items.length === 0) {
        throw new Error('No se detectaron productos en la imagen')
      }

      // Ensure integers
      parsed.items = parsed.items.map(item => ({
        ...item,
        quantity: Math.round(item.quantity) || 1,
        unit_price: Math.round(item.unit_price) || 0,
        total_price: Math.round(item.total_price) || 0,
      }))
      parsed.total = Math.round(parsed.total) || 0

      return parsed
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Error al escanear')
      setError(e)
      throw e
    } finally {
      setIsLoading(false)
    }
  }

  return { scanReceipt, isLoading, error }
}
