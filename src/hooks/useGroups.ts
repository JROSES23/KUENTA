import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Tables } from '../types/database'

type Group = Tables<'groups'>

export function useGroups() {
  const userId = useAuthStore((s) => s.user?.id)
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadGroups = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('groups')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })

      if (err) throw new Error(err.message)
      setGroups(data ?? [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setGroups([])
      setIsLoading(false)
      return
    }

    let cancelled = false

    setIsLoading(true)
    supabase
      .from('groups')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(new Error(err.message))
        else setGroups(data ?? [])
        setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [userId])

  async function createGroup(name: string, emoji: string, description?: string) {
    if (!userId) throw new Error('No autenticado')

    const { data, error: err } = await supabase
      .from('groups')
      .insert({ name, emoji, description: description ?? null, created_by: userId })
      .select()
      .single()

    if (err) throw new Error(err.message)

    const { error: memberErr } = await supabase
      .from('group_members')
      .insert({ group_id: data.id, user_id: userId, role: 'admin' })

    if (memberErr) {
      await supabase.from('groups').delete().eq('id', data.id)
      throw new Error('Error al crear grupo: ' + memberErr.message)
    }

    setGroups(prev => [data, ...prev])
    return data
  }

  return { groups, isLoading, error, refresh: loadGroups, createGroup }
}
