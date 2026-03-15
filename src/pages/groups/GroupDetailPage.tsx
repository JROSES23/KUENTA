import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, DollarSign, Users, UserPlus, Phone } from 'lucide-react'
import { AmbientBlobs } from '../../components/ui/AmbientBlobs'
import { Spinner } from '../../components/ui/Spinner'
import { Avatar } from '../../components/ui/Avatar'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { useGroupDetail } from '../../hooks/useGroupDetail'
import { formatCLP } from '../../utils/formatCLP'
import { normalizePhone } from '../../utils/phoneNormalize'
import { ROUTES } from '../../constants/routes'

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { detail, isLoading, error, inviteMember } = useGroupDetail(id ?? '')
  const [tab, setTab] = useState<'expenses' | 'balances'>('expenses')

  // Invite modal state
  const [showInvite, setShowInvite] = useState(false)
  const [invitePhone, setInvitePhone] = useState('')
  const [guestName, setGuestName] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [needsName, setNeedsName] = useState(false)

  function resetInvite() {
    setShowInvite(false)
    setInvitePhone('')
    setGuestName('')
    setInviteError('')
    setInviteLoading(false)
    setNeedsName(false)
  }

  async function handleInvite() {
    const phone = normalizePhone(invitePhone)
    if (phone.length < 11) {
      setInviteError('Numero invalido')
      return
    }

    setInviteLoading(true)
    setInviteError('')

    try {
      await inviteMember(phone, guestName.trim() || undefined)
      resetInvite()
    } catch (err) {
      const msg = (err as Error).message
      if (msg === 'Nombre requerido para invitado') {
        setNeedsName(true)
        setInviteError('No tiene cuenta. Ingresa su nombre para agregarlo como invitado.')
      } else {
        setInviteError(msg)
      }
    } finally {
      setInviteLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--bg)]">
        <Spinner size={28} />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[var(--bg)] px-5">
        <p className="font-ui text-title text-[var(--red)] mb-4">Error al cargar el grupo</p>
        <Button onClick={() => navigate(ROUTES.GROUPS)}>Volver</Button>
      </div>
    )
  }

  const { group, members, expenses } = detail

  return (
    <div className="h-full flex flex-col bg-[var(--bg)]">
      {/* Header */}
      <div
        className="relative overflow-hidden px-[22px] pt-[52px] pb-6"
        style={{ background: 'var(--header-gradient)' }}
      >
        <AmbientBlobs />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 border border-white/15"
            >
              <ChevronLeft size={14} strokeWidth={2.5} className="text-white" />
            </button>
            <h2 className="font-ui text-h2 text-white flex-1 truncate">{group.name}</h2>
            <button
              onClick={() => setShowInvite(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 border border-white/15"
            >
              <UserPlus size={14} strokeWidth={2.5} className="text-white" />
            </button>
          </div>

          {/* Members row */}
          <div className="flex items-center gap-1.5">
            {members.slice(0, 5).map((m, i) => (
              <Avatar
                key={i}
                name={m.user?.display_name ?? m.guest_name ?? '?'}
                imageUrl={m.user?.avatar_url}
                size="sm"
                className="border-2 border-[#1A1640] -ml-1.5 first:ml-0"
              />
            ))}
            <span className="font-ui text-body-sm text-white/50 ml-1">
              {members.length} personas
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-3.5 pt-4 pb-2">
        <button
          onClick={() => setTab('expenses')}
          className={`px-4 py-2 rounded-pill font-ui text-body-sm transition-colors ${
            tab === 'expenses'
              ? 'bg-[var(--purple-bg)] text-[var(--purple-text)] font-semibold'
              : 'bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)]'
          }`}
        >
          Gastos
        </button>
        <button
          onClick={() => setTab('balances')}
          className={`px-4 py-2 rounded-pill font-ui text-body-sm transition-colors ${
            tab === 'balances'
              ? 'bg-[var(--purple-bg)] text-[var(--purple-text)] font-semibold'
              : 'bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)]'
          }`}
        >
          Saldos
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3.5 pb-6" style={{ scrollbarWidth: 'none' }}>
        {tab === 'expenses' ? (
          expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <DollarSign size={32} strokeWidth={1.5} className="text-[var(--text-3)] mb-3" />
              <p className="font-ui text-title text-[var(--text-2)] mb-1">Sin gastos</p>
              <p className="font-ui text-body-sm text-[var(--text-3)] mb-4">
                Agrega el primer gasto del grupo
              </p>
              <Button onClick={() => navigate(ROUTES.NEW_EXPENSE)} className="!w-auto px-6">
                Agregar gasto
              </Button>
            </div>
          ) : (
            expenses.map(exp => (
              <Card key={exp.id} className="mb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-ui text-title text-[var(--text)]">{exp.title}</p>
                    <p className="font-ui text-body-sm text-[var(--text-2)]">
                      {new Date(exp.created_at).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  <p className="font-ui text-title text-[var(--text)]">
                    {formatCLP(exp.total_amount)}
                  </p>
                </div>
              </Card>
            ))
          )
        ) : (
          /* Members list in Saldos tab */
          members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users size={32} strokeWidth={1.5} className="text-[var(--text-3)] mb-3" />
              <p className="font-ui text-body-sm text-[var(--text-3)]">
                Los saldos se calculan al agregar gastos
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {members.map((m, i) => (
                <Card key={i}>
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={m.user?.display_name ?? m.guest_name ?? '?'}
                      imageUrl={m.user?.avatar_url}
                      size="sm"
                    />
                    <div className="flex-1">
                      <p className="font-ui text-title text-[var(--text)]">
                        {m.user?.display_name ?? m.guest_name ?? 'Sin nombre'}
                      </p>
                      <p className="font-ui text-body-sm text-[var(--text-3)]">
                        {m.user_id ? 'Miembro' : 'Invitado'}
                        {m.role === 'admin' ? ' · Admin' : ''}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}
      </div>

      {/* Invite member bottom sheet */}
      <BottomSheet isOpen={showInvite} onClose={resetInvite}>
        <h3 className="font-ui text-h3 text-[var(--text)] mb-4">Agregar miembro</h3>

        <Input
          placeholder="9 1234 5678"
          prefix={<><Phone size={14} strokeWidth={2} /><span className="font-ui text-body">+56</span></>}
          value={invitePhone}
          onChange={e => {
            setInvitePhone(e.target.value.replace(/\D/g, ''))
            setInviteError('')
            setNeedsName(false)
          }}
          maxLength={9}
          inputMode="tel"
          autoFocus
        />

        {needsName && (
          <div className="mt-3">
            <Input
              placeholder="Nombre del invitado"
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              maxLength={40}
              autoFocus
            />
          </div>
        )}

        {inviteError && (
          <p className={`font-ui text-body-sm mt-2 ${needsName ? 'text-[var(--text-2)]' : 'text-[var(--red)]'}`}>
            {inviteError}
          </p>
        )}

        <div className="mt-4">
          <Button
            onClick={handleInvite}
            disabled={inviteLoading || invitePhone.length < 8 || (needsName && !guestName.trim())}
          >
            {inviteLoading ? <Spinner size={20} className="border-white/30 border-t-white" /> : 'Agregar'}
          </Button>
        </div>

        {/* Current members */}
        {members.length > 0 && (
          <div className="mt-5 pt-4 border-t border-[var(--border)]">
            <p className="font-ui text-caption uppercase text-[var(--text-3)] tracking-[0.8px] mb-3">
              Miembros actuales
            </p>
            <div className="flex flex-col gap-2">
              {members.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Avatar
                    name={m.user?.display_name ?? m.guest_name ?? '?'}
                    imageUrl={m.user?.avatar_url}
                    size="sm"
                  />
                  <div className="flex-1">
                    <p className="font-ui text-body text-[var(--text)]">
                      {m.user?.display_name ?? m.guest_name ?? 'Sin nombre'}
                    </p>
                    <p className="font-ui text-body-sm text-[var(--text-3)]">
                      {m.user_id ? 'Registrado' : 'Invitado'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
