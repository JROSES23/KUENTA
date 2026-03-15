import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Tables } from '../types/database'

type Group = Tables<'groups'>

export function useGroups() {
  const { user } = useAuthStore()
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user) {
      setGroups([])
      setIsLoading(false)
      return
    }
    loadGroups()
  }, [user?.id])

  async function loadGroups() {
    if (!user) return
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
  }

  async function createGroup(name: string, emoji: string, description?: string) {
    console.log('1. createGroup called, user:', user?.id)
    if (!user) throw new Error('No autenticado')

    console.log('2. Inserting into groups...')
    const { data, error: err } = await supabase
      .from('groups')
      .insert({ name, emoji, description: description ?? null, created_by: user.id })
      .select()
      .single()

    console.log('3. groups result:', data, err)
    if (err) throw new Error(err.message)

    console.log('4. Inserting into group_members...')
    const { error: memberErr } = await supabase
      .from('group_members')
      .insert({ group_id: data.id, user_id: user.id, role: 'admin' })

    console.log('5. group_members result:', memberErr)
    if (memberErr) {
      // Rollback: delete orphaned group
      await supabase.from('groups').delete().eq('id', data.id)
      throw new Error('Error al crear grupo: ' + memberErr.message)
    }

    console.log('6. Success, updating local state')
    setGroups(prev => [data, ...prev])
    return data
  }

  return { groups, isLoading, error, refresh: loadGroups, createGroup }
}
