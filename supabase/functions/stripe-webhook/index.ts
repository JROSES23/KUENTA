// Vacio hasta Fase 1 — placeholder para webhook de Stripe
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  return new Response('Not implemented', { status: 501 })
})
