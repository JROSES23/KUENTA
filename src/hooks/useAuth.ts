import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const { user, session, profile, isLoading, setUser, setSession, setProfile, setLoading, reset } =
    useAuthStore()

  useEffect(() => {
    let mounted = true

    // Safety timeout: if everything hangs, force loading off after 5s
    const safetyTimeout = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 5000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      clearTimeout(safetyTimeout)
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }).catch(() => {
      if (mounted) {
        clearTimeout(safetyTimeout)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          reset()
          setLoading(false)
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
    setLoading(true)
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
    } finally {
      setLoading(false)
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
    try {
      await supabase.auth.signOut()
    } catch {
      // Ignore signOut errors — clear local state anyway
    }
    reset()
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
