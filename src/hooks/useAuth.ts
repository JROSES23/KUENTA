import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const { user, session, profile, isLoading, setUser, setSession, setProfile, setLoading, reset } =
    useAuthStore()
  const initializedRef = useRef(false)

  useEffect(() => {
    let mounted = true

    // Safety timeout: force loading off after 5s
    const safetyTimeout = setTimeout(() => {
      if (mounted && !initializedRef.current) {
        initializedRef.current = true
        setLoading(false)
      }
    }, 5000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      clearTimeout(safetyTimeout)
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id).then(() => {
          if (mounted) {
            initializedRef.current = true
            setLoading(false)
          }
        })
      } else {
        initializedRef.current = true
        setLoading(false)
      }
    }).catch(() => {
      if (mounted) {
        clearTimeout(safetyTimeout)
        initializedRef.current = true
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        // Skip INITIAL_SESSION — getSession() above already handles it
        if (event === 'INITIAL_SESSION') return

        // For TOKEN_REFRESHED, only update session/user — don't reload profile
        if (event === 'TOKEN_REFRESHED') {
          setSession(session)
          setUser(session?.user ?? null)
          return
        }

        // SIGNED_IN, SIGNED_OUT, USER_UPDATED, etc.
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          reset()
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [])

  async function loadProfile(userId: string) {
    // NEVER set isLoading here — that's only for initial bootstrap
    // Setting isLoading causes PrivateRoute to unmount everything
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      setProfile(data)
    } catch {
      // Profile might not exist yet (new Google OAuth user)
      setProfile(null)
    }
  }

  async function signInWithOTP(phone: string) {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { channel: 'sms' },
    })
    if (error) throw error
  }

  async function verifyOTP(phone: string, token: string) {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    })
    if (error) throw error
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }

  async function signOut() {
    // Clear local state first so UI redirects immediately
    reset()
    try {
      await supabase.auth.signOut()
    } catch {
      // Ignore signOut errors — local state already cleared
    }
  }

  async function updateProfile(updates: Partial<{ display_name: string; avatar_url: string }>) {
    if (!user) throw new Error('No hay usuario autenticado')
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw error
    setProfile(data)
    return data
  }

  return {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated: !!user,
    hasProfile: !!profile?.display_name,
    signInWithOTP,
    signInWithGoogle,
    verifyOTP,
    signOut,
    updateProfile,
  }
}
