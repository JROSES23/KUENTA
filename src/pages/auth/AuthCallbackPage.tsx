import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui/Spinner'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    handleCallback()
  }, [])

  async function handleCallback() {
    try {
      // Supabase reads the tokens from the URL hash automatically
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        setError(sessionError.message)
        setTimeout(() => navigate('/login', { replace: true }), 2000)
        return
      }

      if (session) {
        // Check if user has a profile
        const { data: profile } = await supabase
          .from('users')
          .select('display_name')
          .eq('id', session.user.id)
          .single()

        if (profile?.display_name) {
          navigate('/', { replace: true })
        } else {
          navigate('/perfil/setup', { replace: true })
        }
      } else {
        // No session — redirect to login
        setError('No se pudo completar el inicio de sesion')
        setTimeout(() => navigate('/login', { replace: true }), 2000)
      }
    } catch {
      setError('Error inesperado')
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    }
  }

  return (
    <div className="h-full flex flex-col items-center justify-center bg-[var(--bg)] gap-4">
      {error ? (
        <>
          <p className="font-ui text-body text-[var(--red)]">{error}</p>
          <p className="font-ui text-body-sm text-[var(--text-3)]">Redirigiendo al login...</p>
        </>
      ) : (
        <>
          <Spinner size={32} />
          <p className="font-ui text-body text-[var(--text-2)]">Completando inicio de sesion...</p>
        </>
      )}
    </div>
  )
}
