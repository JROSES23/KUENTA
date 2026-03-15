// Vacio hasta Fase 1 — placeholder para suscripciones Stripe
import { handleCors } from '../_shared/cors.ts'
import { errorResponse } from '../_shared/errors.ts'

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  return errorResponse('Suscripciones no disponibles todavia', 501)
})
