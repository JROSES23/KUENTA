import { handleCors } from '../_shared/cors.ts'
import { requireAuth, getServiceClient } from '../_shared/auth.ts'
import { errorResponse, successResponse } from '../_shared/errors.ts'
import { checkScanLimit, recordUsage } from '../_shared/plans.ts'

interface ReceiptItem {
  name: string
  quantity: number
  unit_price: number
  total_price: number
}

interface ScanResult {
  store: string
  date: string | null
  total: number
  items: ReceiptItem[]
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { user } = await requireAuth(req)
    const serviceClient = getServiceClient()

    const canScan = await checkScanLimit(user.id, serviceClient)
    if (!canScan) {
      return errorResponse('Limite de scans del plan gratuito alcanzado', 403)
    }

    const formData = await req.formData()
    const imageFile = formData.get('image') as File | null
    if (!imageFile) return errorResponse('No se recibio imagen')

    const arrayBuffer = await imageFile.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    const mimeType = imageFile.type || 'image/jpeg'

    // 30s timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    let geminiRes: Response
    try {
      geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text: `Eres un extractor de datos de boletas chilenas.
Analiza esta imagen y extrae TODOS los items comprados.

Responde UNICAMENTE con JSON valido, sin texto adicional, sin markdown:
{
  "store": "nombre del local",
  "date": "DD/MM/YYYY",
  "total": 12345,
  "items": [
    { "name": "nombre del producto", "quantity": 1, "unit_price": 2490, "total_price": 2490 }
  ]
}

Reglas:
- Montos siempre en numeros enteros CLP (sin puntos ni $)
- Si no puedes leer un valor, usa null
- Incluye TODOS los items, incluso los que repiten
- El total debe coincidir con la suma de items`
                },
                {
                  inline_data: { mime_type: mimeType, data: base64 }
                }
              ]
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 2000 }
          })
        }
      )
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return errorResponse('Timeout: la IA tardo mas de 30 segundos', 504)
      }
      throw err
    } finally {
      clearTimeout(timeout)
    }

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text().catch(() => '')
      console.error('Gemini error:', geminiRes.status, errBody)
      return errorResponse('Error al procesar la imagen con IA', 502)
    }

    const geminiData = await geminiRes.json()
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    let result: ScanResult
    try {
      const cleanJson = rawText.replace(/```json?/g, '').replace(/```/g, '').trim()
      result = JSON.parse(cleanJson)
    } catch {
      console.error('Gemini raw response:', rawText)
      return errorResponse('No se pudo interpretar la respuesta de la IA')
    }

    // Ensure all prices are integers
    result.total = Math.round(result.total ?? 0)
    result.items = (result.items ?? []).map(item => ({
      ...item,
      quantity: Math.round(item.quantity ?? 1),
      unit_price: Math.round(item.unit_price ?? 0),
      total_price: Math.round(item.total_price ?? 0),
    }))

    await recordUsage(user.id, 'scan', serviceClient)

    return successResponse(result)

  } catch (err) {
    console.error(err)
    return errorResponse((err as Error).message, 500)
  }
})
