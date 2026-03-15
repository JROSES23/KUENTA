import { useState, useEffect, useCallback } from 'react'
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
  const userId = useAuthStore((s) => s.user?.id)
  const [detail, setDetail] = useState<GroupDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadDetail = useCallback(async () => {
    if (!userId || !groupId) return
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
  }, [userId, groupId])

  useEffect(() => {
    if (!userId || !groupId) {
      setDetail(null)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    Promise.all([
      supabase.from('groups').select('*').eq('id', groupId).single(),
      supabase.from('group_members').select('*, user:user_id(display_name, avatar_url)').eq('group_id', groupId),
      supabase.from('expenses').select('*').eq('group_id', groupId).order('created_at', { ascending: false }),
    ]).then(([groupRes, membersRes, expensesRes]) => {
      if (cancelled) return
      if (groupRes.error) {
        setError(new Error(groupRes.error.message))
        setIsLoading(false)
        return
      }
      setDetail({
        group: groupRes.data,
        members: (membersRes.data ?? []) as GroupDetail['members'],
        expenses: expensesRes.data ?? [],
      })
      setIsLoading(false)
    }).catch(err => {
      if (!cancelled) {
        setError(err as Error)
        setIsLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [userId, groupId])

  async function inviteMember(phone: string, guestName?: string) {
    if (!groupId) throw new Error('No hay grupo')

    // Buscar si existe usuario con ese teléfono
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single()

    if (existingUser) {
      // Usuario registrado — agregar directo
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: existingUser.id,
          role: 'member',
        })
      if (error) throw new Error(error.message)
    } else {
      // Guest — agregar con teléfono y nombre
      if (!guestName) throw new Error('Nombre requerido para invitado')
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          phone_guest: phone,
          guest_name: guestName,
          role: 'member',
        })
      if (error) throw new Error(error.message)
    }

    await loadDetail()
  }

  return { detail, isLoading, error, refresh: loadDetail, inviteMember }
}
