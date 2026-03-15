import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Wordmark } from '../../components/ui/Wordmark'
import { AmbientBlobs } from '../../components/ui/AmbientBlobs'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { normalizePhone } from '../../utils/phoneNormalize'

function ChileFlag() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
      <rect width="20" height="14" rx="2" fill="#fff" />
      <rect y="7" width="20" height="7" fill="#D52B1E" />
      <rect width="7" height="7" fill="#0039A6" />
      <polygon points="3.5,1.5 4.1,3.3 6,3.3 4.45,4.4 5.05,6.2 3.5,5.1 1.95,6.2 2.55,4.4 1,3.3 2.9,3.3" fill="#fff" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <path d="M14.94 9.88c-.02-2.08 1.7-3.08 1.78-3.13-0.97-1.42-2.48-1.61-3.01-1.63-1.28-.13-2.5.75-3.15.75-.65 0-1.65-.73-2.71-.71-1.4.02-2.68.81-3.4 2.06-1.45 2.51-.37 6.24 1.04 8.28.69 1 1.51 2.12 2.59 2.08 1.04-.04 1.43-.67 2.69-.67 1.25 0 1.61.67 2.71.65 1.12-.02 1.83-.99 2.51-2 .79-1.15 1.12-2.26 1.14-2.32-.02-.01-2.18-.84-2.2-3.32l.01-.04z"/>
      <path d="M12.87 3.17c.57-.69.96-1.65.85-2.6-.82.03-1.82.55-2.41 1.24-.52.61-.98 1.58-.86 2.51.92.07 1.85-.46 2.42-1.15z"/>
    </svg>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { signInWithOTP } = useAuth()
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogle = async () => {
    setError('')
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
        },
      })
    } catch (err) {
      setError((err as Error).message || 'Error al iniciar con Google')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phone || phone.length < 8) {
      setError('Ingresa un numero valido')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const normalized = normalizePhone(phone)
      await signInWithOTP(normalized)
      navigate('/otp', { state: { phone: normalized } })
    } catch (err) {
      setError((err as Error).message || 'Error al enviar el codigo')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg)]">
      {/* Header with gradient */}
      <div
        className="relative overflow-hidden px-[22px] pt-[52px] pb-8"
        style={{ background: 'var(--header-gradient)' }}
      >
        <AmbientBlobs />
        <div className="relative z-10">
          <Wordmark size="md" className="mb-4" />
          <h2 className="font-ui text-h2 text-white mb-1">Bienvenido</h2>
          <p className="font-ui text-body-sm text-white/50">
            Ingresa tu numero para continuar
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 pt-7 pb-6 flex flex-col">
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {/* Phone input */}
          <label className="font-ui text-caption uppercase text-[var(--text-3)] mb-2 tracking-[0.8px]">
            Numero de telefono
          </label>
          <Input
            type="tel"
            inputMode="numeric"
            placeholder="9 1234 5678"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError('') }}
            prefix={<><ChileFlag /><span className="text-[var(--text)] font-medium">+56</span></>}
            autoFocus
          />

          {error && (
            <p className="font-ui text-body-sm text-[var(--red)] mt-2">{error}</p>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="font-ui text-body-sm text-[var(--text-3)]">o continua con</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          {/* Social buttons */}
          <div className="flex gap-3 mb-6">
            <Button variant="social" type="button" className="flex-1" onClick={handleGoogle}>
              <GoogleIcon />
              Google
            </Button>
            <Button variant="social" type="button" className="flex-1">
              <AppleIcon />
              Apple
            </Button>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* CTA */}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Spinner size={20} className="border-white/30 border-t-white" /> : (
              <>
                Continuar
                <ArrowRight size={16} strokeWidth={2} />
              </>
            )}
          </Button>

          {/* Terms */}
          <p className="font-ui text-micro text-center text-[var(--text-3)] mt-4">
            Al continuar aceptas los{' '}
            <span className="text-[var(--purple-text)]">Terminos de Servicio</span>
            {' '}y{' '}
            <span className="text-[var(--purple-text)]">Politica de Privacidad</span>
          </p>
        </form>
      </div>
    </div>
  )
}
