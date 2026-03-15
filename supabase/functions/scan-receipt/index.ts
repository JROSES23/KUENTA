import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY')

    const body = await req.json()
    const { image, mimeType = 'image/jpeg' } = body
    if (!image) throw new Error('Missing image data')

    const prompt = `Eres un extractor de datos de boletas chilenas.
Analiza esta imagen y extrae TODOS los items comprados.
Responde UNICAMENTE con JSON valido, sin texto adicional ni markdown:
{
  "store": "nombre del local",
  "date": "DD/MM/YYYY",
  "total": 16910,
  "items": [
    { "name": "nombre producto", "quantity": 1, "unit_price": 2490, "total_price": 2490 }
  ]
}
Reglas:
- Montos siempre integers CLP sin puntos ni simbolo $
- Incluye TODOS los items
- Si no puedes leer un valor usa null`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: image } }
            ]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
        })
      }
    )

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      throw new Error(`Gemini error ${geminiRes.status}: ${errText}`)
    }

    const geminiData = await geminiRes.json()
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('No text in Gemini response')

    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(clean)

    // Ensure all prices are integers
    parsed.total = Math.round(parsed.total ?? 0)
    parsed.items = (parsed.items ?? []).map((item: Record<string, unknown>) => ({
      ...item,
      quantity: Math.round((item.quantity as number) ?? 1),
      unit_price: Math.round((item.unit_price as number) ?? 0),
      total_price: Math.round((item.total_price as number) ?? 0),
    }))

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('scan-receipt error:', (err as Error).message)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
