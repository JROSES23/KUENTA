import { getServiceClient } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'

async function verifyHMAC(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const hexSig = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Timing-safe comparison
  if (hexSig.length !== signature.length) return false
  let result = 0
  for (let i = 0; i < hexSig.length; i++) {
    result |= hexSig.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return result === 0
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('x-khipu-signature') ?? ''

  if (!await verifyHMAC(rawBody, signature, Deno.env.get('KHIPU_SECRET')!)) {
    console.error('Firma HMAC invalida', { signature })
    return new Response('Unauthorized', { status: 401 })
  }

  const body = new URLSearchParams(rawBody)
  const paymentId = body.get('payment_id')
  const status = body.get('status')
  const transactionId = body.get('transaction_id')

  if (status !== 'done' || !paymentId || !transactionId) {
    return new Response('OK', { status: 200 })
  }

  const [expenseId, userId] = transactionId.split(':')
  if (!expenseId || !userId) {
    return new Response('OK', { status: 200 })
  }

  const supabase = getServiceClient()

  const { data: split } = await supabase
    .from('expense_splits')
    .select('*')
    .eq('expense_id', expenseId)
    .eq('user_id', userId)
    .eq('khipu_payment_id', paymentId)
    .single()

  if (!split || split.is_paid) {
    return new Response('OK', { status: 200 })
  }

  await supabase
    .from('expense_splits')
    .update({ is_paid: true, paid_at: new Date().toISOString() })
    .eq('expense_id', expenseId)
    .eq('user_id', userId)

  const { data: expense } = await supabase
    .from('expenses')
    .select('*, users!paid_by(display_name)')
    .eq('id', expenseId)
    .single()

  if (expense) {
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', expense.group_id)
      .not('user_id', 'is', null)

    const visibleTo = members?.map((m: { user_id: string }) => m.user_id).filter(Boolean) ?? []

    await supabase.from('activity_feed').insert({
      actor_id: userId,
      type: 'payment_made',
      payload: {
        expense_id: expenseId,
        amount: split.amount_owed,
        to_user_id: expense.paid_by,
        to_name: (expense as Record<string, unknown>).users?.display_name ?? 'Usuario',
        title: expense.title,
      },
      visible_to: visibleTo,
    })
  }

  return new Response('OK', { status: 200 })
})
