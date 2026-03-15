import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ROUTES } from '../constants/routes'
import { Spinner } from '../components/ui/Spinner'
import { useEffect } from 'react'

interface GuardProps {
  children: React.ReactNode
}

function LoadingScreen() {
  const setLoading = useAuthStore((s) => s.setLoading)

  useEffect(() => {
    // Safety net: if auth takes more than 4s, force loading to false
    // This lets the normal guard logic (user check) handle the redirect
    const t = setTimeout(() => setLoading(false), 4000)
    return () => clearTimeout(t)
  }, [setLoading])

  return (
    <div className="h-full flex items-center justify-center bg-[var(--bg)]">
      <Spinner size={28} />
    </div>
  )
}

export function PrivateRoute({ children }: GuardProps) {
  const { user, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) return <LoadingScreen />
  if (!user) return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  return <>{children}</>
}

export function GuestRoute({ children }: GuardProps) {
  const { user, isLoading } = useAuthStore()

  if (isLoading) return <LoadingScreen />
  if (user) return <Navigate to={ROUTES.FEED} replace />
  return <>{children}</>
}
