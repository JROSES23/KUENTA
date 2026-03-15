import { handleCors } from '../_shared/cors.ts'
import { requireAuth } from '../_shared/auth.ts'
import { errorResponse, successResponse } from '../_shared/errors.ts'

interface KhipuPaymentRequest {
  expense_id: string
  split_user_id: string
  amount: number
  subject: string
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { user, supabase } = await requireAuth(req)
    const body: KhipuPaymentRequest = await req.json()

    const { data: split, error: splitError } = await supabase
      .from('expense_splits')
      .select('*, expenses(title, group_id)')
      .eq('expense_id', body.expense_id)
      .eq('user_id', user.id)
      .eq('is_paid', false)
      .single()

    if (splitError || !split) {
      return errorResponse('Split no encontrado o ya pagado', 404)
    }

    if (split.amount_owed !== body.amount) {
      return errorResponse('Monto no coincide con el split')
    }

    const khipuRes = await fetch('https://khipu.com/api/2.0/payments', {
      method: 'POST',
      headers: {
        'Authorization': `${Deno.env.get('KHIPU_RECEIVER_ID')}:${Deno.env.get('KHIPU_SECRET')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        subject: body.subject,
        currency: 'CLP',
        amount: body.amount.toString(),
        transaction_id: `${body.expense_id}:${user.id}`,
        return_url: `${Deno.env.get('APP_URL')}/pago-ok/${body.expense_id}`,
        notify_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/khipu-webhook`,
        payer_email: '',
      }).toString(),
    })

    if (!khipuRes.ok) {
      const err = await khipuRes.text()
      console.error('Khipu error:', err)
      return errorResponse('Error al crear el cobro en Khipu', 502)
    }

    const khipuData = await khipuRes.json()

    await supabase
      .from('expense_splits')
      .update({
        khipu_payment_id: khipuData.payment_id,
        khipu_payment_url: khipuData.payment_url,
      })
      .eq('expense_id', body.expense_id)
      .eq('user_id', user.id)

    return successResponse({
      payment_url: khipuData.payment_url,
      payment_id: khipuData.payment_id,
    })

  } catch (err) {
    console.error(err)
    return errorResponse((err as Error).message, 500)
  }
})
