import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wordmark } from '../../components/ui/Wordmark'

export default function SplashPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => navigate('/login', { replace: true }), 2500)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <div
      className="relative h-full w-full flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0D0B1A 0%, #1A1640 50%, #0D1830 100%)' }}
    >
      {/* Ambient blobs */}
      <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-[rgba(76,68,170,0.35)] blur-[70px] pointer-events-none" />
      <div className="absolute -bottom-10 -right-12 w-56 h-56 rounded-full bg-[rgba(24,95,165,0.25)] blur-[70px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-[rgba(104,96,200,0.2)] blur-[70px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <Wordmark size="lg" />
        <p className="font-ui text-[12px] font-medium tracking-[2px] uppercase text-white/35">
          divide &middot; paga &middot; listo
        </p>
      </div>

      {/* Loading dots */}
      <div className="relative z-10 flex gap-2 mt-12">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[rgba(136,128,222,0.5)]"
            style={{ animation: `pulse-dot 1.4s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </div>
  )
}
