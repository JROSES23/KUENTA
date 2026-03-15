import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()
  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 rounded-full flex items-center justify-center
                 bg-[var(--surface)] border border-[var(--border)]
                 shadow-[var(--card-shadow)] transition-transform hover:scale-105 active:scale-95"
    >
      {theme === 'dark'
        ? <Sun size={16} className="text-[var(--text-2)]" />
        : <Moon size={16} className="text-[var(--text-2)]" />
      }
    </button>
  )
}
