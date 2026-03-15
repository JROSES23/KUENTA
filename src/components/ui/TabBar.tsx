import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Users, DollarSign, User, Plus } from 'lucide-react'
import { cn } from '../../utils/cn'
import { ROUTES } from '../../constants/routes'

interface TabItemProps {
  icon: React.ReactNode
  label: string
  path: string
  isActive: boolean
  onClick: () => void
}

function TabItem({ icon, label, isActive, onClick }: TabItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px]',
        isActive ? 'text-[var(--primary-2)]' : 'text-[var(--text-3)]'
      )}
    >
      {icon}
      <span className={cn(
        'font-ui text-micro',
        isActive && 'font-semibold'
      )}>
        {label}
      </span>
    </button>
  )
}

interface TabBarProps {
  onFabPress: () => void
}

export function TabBar({ onFabPress }: TabBarProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-6 z-40">
      <nav className="flex items-center justify-around py-2.5 px-1.5 bg-[var(--tab-bg)] border border-[var(--border)] rounded-tab backdrop-blur-[30px]">
        <TabItem
          icon={<Home size={20} strokeWidth={2} />}
          label="Inicio"
          path={ROUTES.FEED}
          isActive={isActive(ROUTES.FEED)}
          onClick={() => navigate(ROUTES.FEED)}
        />
        <TabItem
          icon={<Users size={20} strokeWidth={2} />}
          label="Grupos"
          path={ROUTES.GROUPS}
          isActive={isActive(ROUTES.GROUPS)}
          onClick={() => navigate(ROUTES.GROUPS)}
        />

        {/* FAB */}
        <button
          onClick={onFabPress}
          className="w-[50px] h-[50px] rounded-full flex items-center justify-center
                     bg-gradient-to-br from-[#4C44AA] to-[#6860C8]
                     shadow-[0_4px_18px_rgba(76,68,170,0.45)]
                     active:scale-[0.88] transition-transform"
        >
          <Plus size={22} strokeWidth={2.5} className="text-white" />
        </button>

        <TabItem
          icon={<DollarSign size={20} strokeWidth={2} />}
          label="Deudas"
          path={ROUTES.DEBTS}
          isActive={isActive(ROUTES.DEBTS)}
          onClick={() => navigate(ROUTES.DEBTS)}
        />
        <TabItem
          icon={<User size={20} strokeWidth={2} />}
          label="Perfil"
          path={ROUTES.PROFILE}
          isActive={isActive(ROUTES.PROFILE)}
          onClick={() => navigate(ROUTES.PROFILE)}
        />
      </nav>
    </div>
  )
}
