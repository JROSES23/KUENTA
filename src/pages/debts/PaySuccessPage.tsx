import { useNavigate, useParams } from 'react-router-dom'
import { Check, Share2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export default function PaySuccessPage() {
  const navigate = useNavigate()
  const { expenseId: _expenseId } = useParams()

  return (
    <div className="h-full flex flex-col items-center justify-center bg-[var(--bg)] px-5">
      {/* Success ring */}
      <div className="w-24 h-24 rounded-full flex items-center justify-center bg-[var(--green-bg)] success-ring mb-6"
           style={{ boxShadow: '0 0 50px rgba(13, 172, 103, 0.35)' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[var(--green)]">
          <Check size={32} strokeWidth={2.5} className="text-white" />
        </div>
      </div>

      <h2 className="font-ui text-h2 text-[var(--text)] mb-2">Pago exitoso</h2>
      <p className="font-ui text-body text-[var(--text-2)] text-center mb-8">
        Tu pago fue procesado correctamente
      </p>

      <div className="w-full flex flex-col gap-3">
        <Button onClick={() => navigate('/', { replace: true })}>
          Volver al inicio
        </Button>
        <Button variant="ghost" onClick={() => {}}>
          <Share2 size={16} strokeWidth={2} />
          Compartir comprobante
        </Button>
      </div>
    </div>
  )
}
