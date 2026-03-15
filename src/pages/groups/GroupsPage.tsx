import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Users } from 'lucide-react'
import { TabBar } from '../../components/ui/TabBar'
import { Spinner } from '../../components/ui/Spinner'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { GroupCard } from '../../components/groups/GroupCard'
import { useGroups } from '../../hooks/useGroups'

export default function GroupsPage() {
  const navigate = useNavigate()
  const { groups, isLoading, createGroup } = useGroups()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    setCreateError('')
    try {
      await createGroup(newName.trim(), '')
      setShowCreate(false)
      setNewName('')
    } catch (err) {
      setCreateError((err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg)] relative">
      {/* Header */}
      <div
        className="relative overflow-hidden px-[22px] pt-[52px] pb-6"
        style={{ background: 'var(--header-gradient)' }}
      >
        <div className="relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 border border-white/15 mb-3"
          >
            <ChevronLeft size={14} strokeWidth={2.5} className="text-white" />
          </button>
          <h2 className="font-ui text-h2 text-white">Mis grupos</h2>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3.5 pt-4 pb-24" style={{ scrollbarWidth: 'none' }}>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size={28} />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users size={32} strokeWidth={1.5} className="text-[var(--text-3)] mb-3" />
            <p className="font-ui text-title text-[var(--text-2)] mb-1">Sin grupos aun</p>
            <p className="font-ui text-body-sm text-[var(--text-3)]">
              Crea un grupo para comenzar a dividir gastos
            </p>
          </div>
        ) : (
          groups.map(group => (
            <GroupCard
              key={group.id}
              id={group.id}
              name={group.name}
              memberCount={0}
              onClick={() => navigate(`/grupos/${group.id}`)}
            />
          ))
        )}
      </div>

      <TabBar onFabPress={() => setShowCreate(true)} />

      {/* Create group sheet */}
      <BottomSheet isOpen={showCreate} onClose={() => setShowCreate(false)}>
        <h3 className="font-ui text-h3 text-[var(--text)] mb-4">Crear grupo</h3>
        <Input
          placeholder="Nombre del grupo"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          maxLength={40}
          autoFocus
        />
        {createError && (
          <p className="font-ui text-body-sm text-[var(--red)] mt-2">{createError}</p>
        )}
        <div className="mt-4">
          <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
            {creating ? <Spinner size={20} className="border-white/30 border-t-white" /> : 'Crear'}
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}
