import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FREEMIUM_ENABLED = Deno.env.get('FREEMIUM_ENABLED') === 'true'
const FREE_SCAN_LIMIT = 5

export async function checkScanLimit(userId: string, supabase: SupabaseClient): Promise<boolean> {
  if (!FREEMIUM_ENABLED) return true

  const { data: user } = await supabase
    .from('users').select('plan').eq('id', userId).single()
  if (user?.plan === 'premium') return true

  const startOfMonth = new Date()
  startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('plan_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', 'scan')
    .gte('created_at', startOfMonth.toISOString())

  return (count ?? 0) < FREE_SCAN_LIMIT
}

export async function recordUsage(
  userId: string,
  type: 'scan' | 'group_created',
  supabase: SupabaseClient
) {
  await supabase.from('plan_usage').insert({ user_id: userId, type })
}
