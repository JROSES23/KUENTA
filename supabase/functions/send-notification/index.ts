import { handleCors } from '../_shared/cors.ts'
import { getServiceClient } from '../_shared/auth.ts'
import { errorResponse, successResponse } from '../_shared/errors.ts'

interface NotificationPayload {
  user_ids: string[]
  title: string
  body: string
  data?: Record<string, string>
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const authHeader = req.headers.get('Authorization')
    if (authHeader !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
      return errorResponse('Unauthorized', 401)
    }

    const payload: NotificationPayload = await req.json()
    const supabase = getServiceClient()

    const { data: users } = await supabase
      .from('users')
      .select('id, push_token')
      .in('id', payload.user_ids)
      .not('push_token', 'is', null)

    if (!users?.length) return successResponse({ sent: 0 })

    // Push notification integration placeholder
    console.log('Notificaciones a enviar:', {
      tokens: users.map((u: { push_token: string }) => u.push_token),
      title: payload.title,
      body: payload.body,
    })

    return successResponse({ sent: users.length })

  } catch (err) {
    return errorResponse((err as Error).message, 500)
  }
})
