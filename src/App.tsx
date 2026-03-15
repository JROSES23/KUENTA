import { useEffect } from 'react'
import { AppRouter } from './router'
import { useAuth } from './hooks/useAuth'
import { useThemeStore } from './store/themeStore'

export default function App() {
  useAuth()
  const { theme } = useThemeStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return <AppRouter />
}
