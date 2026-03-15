import { useNavigate } from 'react-router-dom'
import { FREEMIUM_ENABLED } from '../../constants/config'
import { ROUTES } from '../../constants/routes'
import { Button } from '../ui/Button'

export function UpgradeBanner() {
  const navigate = useNavigate()

  if (!FREEMIUM_ENABLED) return null

  return (
    <div className="bg-[var(--purple-bg)] border border-[var(--border-2)] rounded-card p-4 mb-4">
      <p className="font-ui text-title text-[var(--purple-text)] mb-1">
        Desbloquea todo con Premium
      </p>
      <p className="font-ui text-body-sm text-[var(--text-2)] mb-3">
        Grupos ilimitados, scans ilimitados y mas.
      </p>
      <Button onClick={() => navigate(ROUTES.UPGRADE)}>
        Ver planes
      </Button>
    </div>
  )
}
