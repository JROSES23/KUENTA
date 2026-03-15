import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Bell, DollarSign, Camera, Users } from 'lucide-react'
import { Wordmark } from '../../components/ui/Wordmark'
import { AmbientBlobs } from '../../components/ui/AmbientBlobs'
import { TabBar } from '../../components/ui/TabBar'
import { Spinner } from '../../components/ui/Spinner'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { FeedCard } from '../../components/feed/FeedCard'
import { useAuth } from '../../hooks/useAuth'
import { useFeed } from '../../hooks/useFeed'
import { useDebts } from '../../hooks/useDebts'
import { formatCLP } from '../../utils/formatCLP'
import { ROUTES } from '../../constants/routes'

export default function FeedPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { events, isLoading: feedLoading } = useFeed()
  const { balance } = useDebts()
  const [showFab, setShowFab] = useState(false)

  return (
    <div className="h-full flex flex-col bg-[var(--bg)] relative">
      {/* Header */}
      <div
        className="relative overflow-hidden px-[22px] pt-[52px] pb-6"
        style={{ background: 'var(--header-gradient)' }}
      >
        <AmbientBlobs />
        <div className="relative z-10">
          {/* Top row */}
          <div className="flex items-center justify-between mb-4">
            <Wordmark size="sm" className="text-[15px] tracking-[2px] !bg-none !text-white/80 ![filter:none]" />
            <button className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 border border-white/15">
              <Bell size={16} strokeWidth={2} className="text-white/70" />
            </button>
          </div>

          {/* Greeting */}
          <p className="font-ui text-body-sm text-white/65 mb-0.5">Hola,</p>
          <h1 className="font-ui text-h1 text-white mb-4">
            {profile?.display_name ?? 'Usuario'}
          </h1>

          {/* Balance pills */}
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2.5 rounded-pill bg-white/[0.14] border border-white/20 backdrop-blur-[12px]">
              <p className="font-ui text-micro text-white/50 mb-0.5">Te deben</p>
              <p className="font-ui text-title text-[#72EDBA]">
                {formatCLP(balance?.total_owed_to_user ?? 0)}
              </p>
            </div>
            <div className="flex-1 px-3 py-2.5 rounded-pill bg-white/[0.14] border border-white/20 backdrop-blur-[12px]">
              <p className="font-ui text-micro text-white/50 mb-0.5">Debes</p>
              <p className="font-ui text-title text-[#FFB4B4]">
                {formatCLP(balance?.total_user_owes ?? 0)}
              </p>
            </div>
            <div className="flex-1 px-3 py-2.5 rounded-pill bg-white/[0.14] border border-white/20 backdrop-blur-[12px]">
              <p className="font-ui text-micro text-white/50 mb-0.5">Neto</p>
              <p className="font-ui text-title text-[#D4D0FF]">
                {formatCLP(balance?.net_balance ?? 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-3.5 pt-4 pb-24" style={{ scrollbarWidth: 'none' }}>
        <h3 className="font-ui text-caption uppercase text-[var(--text-3)] tracking-[0.8px] mb-3">
          Actividad reciente
        </h3>

        {feedLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size={28} />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Activity size={32} strokeWidth={1.5} className="text-[var(--text-3)] mb-3" />
            <p className="font-ui text-title text-[var(--text-2)] mb-1">Aun no hay movimientos</p>
            <p className="font-ui text-body-sm text-[var(--text-3)]">
              Crea un grupo para empezar
            </p>
          </div>
        ) : (
          events.map(event => (
            <FeedCard key={event.id} event={event as never} />
          ))
        )}
      </div>

      {/* Tab Bar */}
      <TabBar onFabPress={() => setShowFab(true)} />

      {/* FAB Bottom Sheet */}
      <BottomSheet isOpen={showFab} onClose={() => setShowFab(false)}>
        <h3 className="font-ui text-h3 text-[var(--text)] mb-4">Nuevo</h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => { setShowFab(false); navigate(ROUTES.NEW_EXPENSE) }}
            className="flex items-center gap-3 p-3.5 rounded-card bg-[var(--surface)] border border-[var(--border)] active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-icon flex items-center justify-center bg-[var(--purple-bg)]">
              <DollarSign size={18} strokeWidth={2} className="text-[var(--purple-text)]" />
            </div>
            <div className="text-left">
              <p className="font-ui text-title text-[var(--text)]">Nuevo split</p>
              <p className="font-ui text-body-sm text-[var(--text-2)]">Divide un gasto con tu grupo</p>
            </div>
          </button>
          <button
            onClick={() => { setShowFab(false); navigate(ROUTES.SCAN_RECEIPT) }}
            className="flex items-center gap-3 p-3.5 rounded-card bg-[var(--surface)] border border-[var(--border)] active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-icon flex items-center justify-center bg-[var(--green-bg)]">
              <Camera size={18} strokeWidth={2} className="text-[var(--green)]" />
            </div>
            <div className="text-left">
              <p className="font-ui text-title text-[var(--text)]">Scan boleta</p>
              <p className="font-ui text-body-sm text-[var(--text-2)]">Escanea y divide automaticamente</p>
            </div>
          </button>
          <button
            onClick={() => { setShowFab(false); navigate(ROUTES.GROUPS) }}
            className="flex items-center gap-3 p-3.5 rounded-card bg-[var(--surface)] border border-[var(--border)] active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-icon flex items-center justify-center bg-[var(--surface)]">
              <Users size={18} strokeWidth={2} className="text-[var(--text-2)]" />
            </div>
            <div className="text-left">
              <p className="font-ui text-title text-[var(--text)]">Crear grupo</p>
              <p className="font-ui text-body-sm text-[var(--text-2)]">Organiza gastos compartidos</p>
            </div>
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
