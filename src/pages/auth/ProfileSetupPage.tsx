import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { Wordmark } from '../../components/ui/Wordmark'
import { AmbientBlobs } from '../../components/ui/AmbientBlobs'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'

export default function ProfileSetupPage() {
  const navigate = useNavigate()
  const { updateProfile } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = displayName.trim()
    if (!name || name.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await updateProfile({ display_name: name })
      navigate('/', { replace: true })
    } catch (err) {
      setError((err as Error).message || 'Error al guardar el perfil')
    } finally {
      setIsLoading(false)
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
          <Wordmark size="sm" className="mb-4" />
          <h2 className="font-ui text-h2 text-white mb-1">Tu perfil</h2>
          <p className="font-ui text-body-sm text-white/50">
            Como quieres que te vean los demas?
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 pt-8 pb-6 flex flex-col">
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {/* Avatar placeholder */}
          <div className="flex justify-center mb-6">
            <button
              type="button"
              className="w-20 h-20 rounded-full flex items-center justify-center bg-[var(--purple-bg)] border-2 border-dashed border-[var(--border-2)] transition-transform active:scale-95"
            >
              <Camera size={24} strokeWidth={2} className="text-[var(--purple-text)]" />
            </button>
          </div>

          {/* Name input */}
          <label className="font-ui text-caption uppercase text-[var(--text-3)] mb-2 tracking-[0.8px]">
            Nombre
          </label>
          <Input
            type="text"
            placeholder="Tu nombre"
            value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); setError('') }}
            maxLength={30}
            autoFocus
          />

          {error && (
            <p className="font-ui text-body-sm text-[var(--red)] mt-2">{error}</p>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Submit */}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Spinner size={20} className="border-white/30 border-t-white" /> : 'Comenzar'}
          </Button>

          {/* Skip */}
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="font-ui text-body-sm text-[var(--text-3)] text-center mt-3 py-2"
          >
            Omitir por ahora
          </button>
        </form>
      </div>
    </div>
  )
}
