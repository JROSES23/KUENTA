import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Wordmark } from '../../components/ui/Wordmark'
import { AmbientBlobs } from '../../components/ui/AmbientBlobs'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import { formatPhoneDisplay } from '../../utils/phoneNormalize'

const OTP_LENGTH = 6
const RESEND_SECONDS = 60

export default function OTPPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const phone = (location.state as { phone?: string })?.phone ?? ''
  const { verifyOTP, signInWithOTP, hasProfile } = useAuth()

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Redirect if no phone in state
  useEffect(() => {
    if (!phone) navigate('/login', { replace: true })
  }, [phone, navigate])

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setInterval(() => setResendTimer(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [resendTimer])

  const handleVerify = useCallback(async (code: string) => {
    setIsVerifying(true)
    setError('')
    try {
      await verifyOTP(phone, code)
      // useAuth listener will update the store
      // Check if profile exists to decide redirect
      setTimeout(() => {
        if (hasProfile) {
          navigate('/', { replace: true })
        } else {
          navigate('/perfil/setup', { replace: true })
        }
      }, 300)
    } catch (err) {
      setError((err as Error).message || 'Codigo incorrecto')
      setDigits(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } finally {
      setIsVerifying(false)
    }
  }, [phone, verifyOTP, hasProfile, navigate])

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return

    const newDigits = [...digits]
    newDigits[index] = value.slice(-1)
    setDigits(newDigits)
    setError('')

    // Auto-advance
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-verify when all filled
    const code = newDigits.join('')
    if (code.length === OTP_LENGTH && !newDigits.includes('')) {
      handleVerify(code)
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return

    const newDigits = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((d, i) => { newDigits[i] = d })
    setDigits(newDigits)

    if (pasted.length === OTP_LENGTH) {
      handleVerify(pasted)
    } else {
      inputRefs.current[pasted.length]?.focus()
    }
  }

  async function handleResend() {
    if (resendTimer > 0) return
    try {
      await signInWithOTP(phone)
      setResendTimer(RESEND_SECONDS)
      setError('')
    } catch (err) {
      setError((err as Error).message || 'Error al reenviar')
    }
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg)]">
      {/* Header */}
      <div
        className="relative overflow-hidden px-[22px] pt-[52px] pb-8"
        style={{ background: 'var(--header-gradient)' }}
      >
        <AmbientBlobs />
        <div className="relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 border border-white/15 mb-4"
          >
            <ChevronLeft size={14} strokeWidth={2.5} className="text-white" />
          </button>
          <Wordmark size="sm" className="mb-4" />
          <h2 className="font-ui text-h2 text-white mb-1">Verificar codigo</h2>
          <p className="font-ui text-body-sm text-white/50">
            Enviamos un SMS a {formatPhoneDisplay(phone)}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 pt-8 pb-6 flex flex-col items-center">
        {/* OTP inputs */}
        <div className="flex gap-2.5 mb-4" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="w-12 h-14 text-center font-ui text-h2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-input text-[var(--text)] focus:border-[var(--border-2)] focus:bg-[var(--surface)] focus:outline-none transition-colors"
              autoFocus={i === 0}
              disabled={isVerifying}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="font-ui text-body-sm text-[var(--red)] mb-4">{error}</p>
        )}

        {/* Verifying indicator */}
        {isVerifying && (
          <div className="flex items-center gap-2 mb-4">
            <Spinner size={16} />
            <span className="font-ui text-body-sm text-[var(--text-2)]">Verificando...</span>
          </div>
        )}

        {/* Resend */}
        <button
          onClick={handleResend}
          disabled={resendTimer > 0}
          className="font-ui text-body-sm mt-2"
          style={{ color: resendTimer > 0 ? 'var(--text-3)' : 'var(--purple-text)' }}
        >
          {resendTimer > 0
            ? `Reenviar codigo en ${resendTimer}s`
            : 'Reenviar codigo'
          }
        </button>
      </div>
    </div>
  )
}
