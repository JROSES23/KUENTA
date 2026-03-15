import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Tables } from '../types/database'

type Group = Tables<'groups'>
type GroupMember = Tables<'group_members'>
type Expense = Tables<'expenses'>

interface GroupDetail {
  group: Group
  members: (GroupMember & { user?: { display_name: string; avatar_url: string | null } })[]
  expenses: Expense[]
}

export function useGroupDetail(groupId: string) {
  const { user } = useAuthStore()
  const [detail, setDetail] = useState<GroupDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user || !groupId) {
      setDetail(null)
      setIsLoading(false)
      return
    }
    loadDetail()
  }, [user?.id, groupId])

  async function loadDetail() {
    if (!user || !groupId) return
    setIsLoading(true)
    try {
      const [groupRes, membersRes, expensesRes] = await Promise.all([
        supabase.from('groups').select('*').eq('id', groupId).single(),
        supabase.from('group_members').select('*, user:user_id(display_name, avatar_url)').eq('group_id', groupId),
        supabase.from('expenses').select('*').eq('group_id', groupId).order('created_at', { ascending: false }),
      ])

      if (groupRes.error) throw new Error(groupRes.error.message)

      setDetail({
        group: groupRes.data,
        members: (membersRes.data ?? []) as GroupDetail['members'],
        expenses: expensesRes.data ?? [],
      })
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  async function addMember(userId?: string, phoneGuest?: string, guestName?: string) {
    if (!groupId) return
    const { error: err } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: userId ?? null,
        phone_guest: phoneGuest ?? null,
        guest_name: guestName ?? null,
      })

    if (err) throw new Error(err.message)
    await loadDetail()
  }

  return { detail, isLoading, error, refresh: loadDetail, addMember }
}
