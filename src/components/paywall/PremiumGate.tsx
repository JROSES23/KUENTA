import { FREEMIUM_ENABLED } from '../../constants/config'
import { usePlan } from '../../hooks/usePlan'

interface PremiumGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PremiumGate({ children, fallback }: PremiumGateProps) {
  const { isPremium } = usePlan()

  // En Fase 0 (FREEMIUM_ENABLED=false): no bloquear nada
  if (!FREEMIUM_ENABLED) return <>{children}</>

  // En Fase 1+: si es premium, mostrar contenido
  if (isPremium) return <>{children}</>

  // Si no es premium, mostrar fallback o nada
  return <>{fallback ?? null}</>
}
