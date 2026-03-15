import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Tables } from '../types/database'

type FeedEvent = Tables<'activity_feed'>

export function useFeed() {
  const { user } = useAuthStore()
  const [events, setEvents] = useState<FeedEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user) {
      setEvents([])
      setIsLoading(false)
      return
    }

    loadFeed()

    const channel = supabase
      .channel('feed-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_feed',
          filter: `visible_to=cs.{${user.id}}`,
        },
        (payload) => {
          setEvents(prev => [payload.new as FeedEvent, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  async function loadFeed() {
    if (!user) return
    setIsLoading(true)
    const { data, error } = await supabase
      .from('activity_feed')
      .select('*, actor:actor_id(id, display_name, avatar_url)')
      .contains('visible_to', [user.id])
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) setError(new Error(error.message))
    else setEvents((data ?? []) as unknown as FeedEvent[])
    setIsLoading(false)
  }

  return { events, isLoading, error, refresh: loadFeed }
}
