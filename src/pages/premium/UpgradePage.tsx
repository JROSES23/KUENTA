import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Check } from 'lucide-react'
import { AmbientBlobs } from '../../components/ui/AmbientBlobs'
import { Wordmark } from '../../components/ui/Wordmark'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { PLAN_PRICE_CLP } from '../../constants/plans'
import { formatCLP } from '../../utils/formatCLP'

const FEATURES = [
  'Grupos ilimitados',
  'Scans de boleta ilimitados',
  'Hasta 50 personas por grupo',
  'Estadisticas avanzadas',
  'Recordatorios automaticos',
  'Exportar a Excel',
]

export default function UpgradePage() {
  const navigate = useNavigate()

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
          <Wordmark size="sm" className="mb-3" />
          <h2 className="font-ui text-h2 text-white mb-1">Premium</h2>
          <p className="font-ui text-body-sm text-white/50">
            Desbloquea todo el potencial de Kuenta
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-6" style={{ scrollbarWidth: 'none' }}>
        <Card className="mb-6">
          <div className="text-center py-2">
            <p className="font-ui text-display text-[var(--purple-text)]">
              {formatCLP(PLAN_PRICE_CLP)}
            </p>
            <p className="font-ui text-body-sm text-[var(--text-2)]">por mes</p>
          </div>
        </Card>

        <h3 className="font-ui text-caption uppercase text-[var(--text-3)] tracking-[0.8px] mb-3">
          Incluye
        </h3>

        <div className="flex flex-col gap-3 mb-8">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[var(--green-bg)]">
                <Check size={14} strokeWidth={2.5} className="text-[var(--green)]" />
              </div>
              <span className="font-ui text-body text-[var(--text)]">{f}</span>
            </div>
          ))}
        </div>

        <Button disabled>
          Proximamente
        </Button>
        <p className="font-ui text-micro text-center text-[var(--text-3)] mt-3">
          Los pagos con Stripe estaran disponibles pronto
        </p>
      </div>
    </div>
  )
}
