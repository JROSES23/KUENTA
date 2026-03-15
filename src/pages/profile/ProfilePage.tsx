import { useNavigate } from 'react-router-dom'
import { LogOut, ChevronRight, User, Sun, Moon } from 'lucide-react'
import { AmbientBlobs } from '../../components/ui/AmbientBlobs'
import { Avatar } from '../../components/ui/Avatar'
import { TabBar } from '../../components/ui/TabBar'
import { useAuth } from '../../hooks/useAuth'
import { useThemeStore } from '../../store/themeStore'
import { formatPhoneDisplay } from '../../utils/phoneNormalize'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { theme, toggleTheme } = useThemeStore()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg)] relative">
      {/* Header */}
      <div
        className="relative overflow-hidden px-[22px] pt-[52px] pb-8"
        style={{ background: 'var(--header-gradient)' }}
      >
        <AmbientBlobs />
        <div className="relative z-10 flex flex-col items-center">
          <Avatar
            name={profile?.display_name ?? 'U'}
            imageUrl={profile?.avatar_url}
            className="w-16 h-16 text-[20px] mb-3 border-2 border-white/20"
          />
          <h1 className="font-ui text-h1 text-white mb-0.5">
            {profile?.display_name ?? 'Usuario'}
          </h1>
          <p className="font-ui text-body-sm text-white/50">
            {profile?.phone ? formatPhoneDisplay(profile.phone) : ''}
          </p>
        </div>
      </div>

      {/* Settings list */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-24" style={{ scrollbarWidth: 'none' }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 py-3.5 border-b border-[var(--border)] active:opacity-70 transition-opacity"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--purple-bg)]">
            {theme === 'dark'
              ? <Sun size={16} strokeWidth={2} className="text-[var(--purple-text)]" />
              : <Moon size={16} strokeWidth={2} className="text-[var(--purple-text)]" />
            }
          </div>
          <span className="flex-1 font-ui text-body text-[var(--text)] text-left">
            {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          </span>
          <ChevronRight size={16} strokeWidth={2} className="text-[var(--text-3)]" />
        </button>

        {/* Edit profile */}
        <button
          onClick={() => navigate('/perfil/setup')}
          className="w-full flex items-center gap-3 py-3.5 border-b border-[var(--border)] active:opacity-70 transition-opacity"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--surface)] border border-[var(--border)]">
            <User size={16} strokeWidth={2} className="text-[var(--text-2)]" />
          </div>
          <span className="flex-1 font-ui text-body text-[var(--text)] text-left">
            Editar perfil
          </span>
          <ChevronRight size={16} strokeWidth={2} className="text-[var(--text-3)]" />
        </button>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 py-3.5 active:opacity-70 transition-opacity"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--red-bg)]">
            <LogOut size={16} strokeWidth={2} className="text-[var(--red)]" />
          </div>
          <span className="flex-1 font-ui text-body text-[var(--red)] text-left">
            Cerrar sesion
          </span>
        </button>
      </div>

      <TabBar onFabPress={() => navigate('/gasto/nuevo')} />
    </div>
  )
}
