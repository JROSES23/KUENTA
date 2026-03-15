import { create } from 'zustand'
import type { Tables } from '../types/database'

type FeedEvent = Tables<'activity_feed'>

interface FeedState {
  events: FeedEvent[]
  isLoading: boolean
  setEvents: (events: FeedEvent[]) => void
  addEvent: (event: FeedEvent) => void
  setLoading: (loading: boolean) => void
}

export const useFeedStore = create<FeedState>()((set) => ({
  events: [],
  isLoading: true,
  setEvents: (events) => set({ events }),
  addEvent: (event) => set((state) => ({ events: [event, ...state.events] })),
  setLoading: (isLoading) => set({ isLoading }),
}))
