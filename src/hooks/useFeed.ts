import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Tables } from '../types/database'

type FeedEvent = Tables<'activity_feed'>

export function useFeed() {
  const userId = useAuthStore((s) => s.user?.id)
  const [events, setEvents] = useState<FeedEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadFeed = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('activity_feed')
        .select('*, actor:actor_id(id, display_name, avatar_url)')
        .contains('visible_to', [userId])
        .order('created_at', { ascending: false })
        .limit(50)

      if (err) setError(new Error(err.message))
      else setEvents((data ?? []) as unknown as FeedEvent[])
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setEvents([])
      setIsLoading(false)
      return
    }

    let cancelled = false

    setIsLoading(true)
    supabase
      .from('activity_feed')
      .select('*, actor:actor_id(id, display_name, avatar_url)')
      .contains('visible_to', [userId])
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(new Error(err.message))
        else setEvents((data ?? []) as unknown as FeedEvent[])
        setIsLoading(false)
      })

    const channel = supabase
      .channel('feed-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_feed',
          filter: `visible_to=cs.{${userId}}`,
        },
        (payload) => {
          setEvents(prev => [payload.new as FeedEvent, ...prev])
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { events, isLoading, error, refresh: loadFeed }
}
