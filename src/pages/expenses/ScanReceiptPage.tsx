import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Camera, Upload, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { useScanReceipt } from '../../hooks/useScanReceipt'
import type { ScanResult } from '../../hooks/useScanReceipt'
import { formatCLP } from '../../utils/formatCLP'
import { ROUTES } from '../../constants/routes'

export default function ScanReceiptPage() {
  const navigate = useNavigate()
  const { scanReceipt, isLoading } = useScanReceipt()
  const fileRef = useRef<HTMLInputElement>(null)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')

  async function handleFile(file: File) {
    setError('')
    try {
      const data = await scanReceipt(file)
      setResult(data)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleUseForSplit() {
    if (!result) return
    navigate(ROUTES.NEW_EXPENSE, {
      state: {
        fromScan: true,
        scanResult: result,
      },
    })
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg)]">
      {/* Header */}
      <div
        className="relative overflow-hidden px-[22px] pt-[52px] pb-6"
        style={{ background: 'var(--header-gradient)' }}
      >
        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 border border-white/15"
          >
            <ChevronLeft size={14} strokeWidth={2.5} className="text-white" />
          </button>
          <h3 className="font-ui text-h3 text-white">Scan boleta</h3>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-6" style={{ scrollbarWidth: 'none' }}>
        {!result ? (
          <>
            {/* Upload area */}
            <div
              onClick={() => !isLoading && fileRef.current?.click()}
              className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-[var(--border-2)] rounded-card cursor-pointer active:scale-[0.98] transition-transform"
            >
              {isLoading ? (
                <>
                  <Spinner size={32} className="mb-3" />
                  <p className="font-ui text-title text-[var(--text-2)]">Procesando imagen...</p>
                  <p className="font-ui text-body-sm text-[var(--text-3)] mt-1">Esto puede tomar unos segundos</p>
                </>
              ) : (
                <>
                  <Camera size={36} strokeWidth={1.5} className="text-[var(--purple-text)] mb-3" />
                  <p className="font-ui text-title text-[var(--text)]">Toma una foto o sube una imagen</p>
                  <p className="font-ui text-body-sm text-[var(--text-3)] mt-1">JPG, PNG — la IA detectara los items</p>
                  <div className="flex items-center gap-2 mt-4">
                    <Upload size={14} strokeWidth={2} className="text-[var(--purple-text)]" />
                    <span className="font-ui text-body-sm text-[var(--purple-text)]">Subir imagen</span>
                  </div>
                </>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {error && (
              <p className="font-ui text-body-sm text-[var(--red)] mt-4 text-center">{error}</p>
            )}
          </>
        ) : (
          <>
            {/* Store name */}
            <div className="mb-4">
              <p className="font-ui text-caption uppercase text-[var(--text-3)] tracking-[0.8px] mb-1">
                Local
              </p>
              <p className="font-ui text-title text-[var(--text)]">{result.store}</p>
              {result.date && (
                <p className="font-ui text-body-sm text-[var(--text-3)] mt-0.5">{result.date}</p>
              )}
            </div>

            {/* Items */}
            <div className="mb-4">
              <p className="font-ui text-caption uppercase text-[var(--text-3)] tracking-[0.8px] mb-2">
                Items detectados ({result.items.length})
              </p>
              {result.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-[var(--border)] last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-ui text-body text-[var(--text)] truncate">{item.name}</p>
                    {item.quantity > 1 && (
                      <p className="font-ui text-micro text-[var(--text-3)]">
                        {item.quantity}x {formatCLP(item.unit_price)}
                      </p>
                    )}
                  </div>
                  <span className="font-ui text-title text-[var(--text)] flex-shrink-0">
                    {formatCLP(item.total_price)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between py-3 border-t border-[var(--border)]">
              <span className="font-ui text-title text-[var(--text)]">Total</span>
              <span className="font-ui text-h3 text-[var(--text)]">{formatCLP(result.total)}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setResult(null); setError('') }}
                className="flex items-center justify-center gap-2 flex-1 py-3 rounded-button font-ui text-body text-[var(--text-2)] bg-[var(--surface)] border border-[var(--border)]"
              >
                <Trash2 size={16} strokeWidth={2} />
                Reintentar
              </button>
              <div className="flex-[2]">
                <Button onClick={handleUseForSplit}>
                  Usar para split
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
