import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/config'

if (import.meta.env.DEV && SUPABASE_ANON_KEY) {
  try {
    const payload = JSON.parse(atob(SUPABASE_ANON_KEY.split('.')[1]))
    if (payload.role === 'service_role') {
      throw new Error('SEGURIDAD: Estas usando la SERVICE_ROLE_KEY en el frontend.')
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('SEGURIDAD')) throw e
  }
}

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  }
)
