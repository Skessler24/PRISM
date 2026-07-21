import { NavLink } from 'react-router-dom'
import { useHelpAssist } from '../lib/help-assist/help-assist-context'
import { useTheme } from '../app/theme-context'

export function TopBar() {
  const { enabled, toggle } = useHelpAssist()
  const { setThemeStudioOpen } = useTheme()

  return (
    <header
      className="fixed inset-x-0 top-0 z-[1000] flex h-16 items-center justify-between px-3 md:px-4"
      style={{ background: 'var(--header-bg)', color: 'var(--header-txt)' }}
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center font-heading text-xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-br from-pink-400 to-orange-400 bg-clip-text text-transparent">
            PR
          </span>
          <svg className="mx-0.5 h-7 w-7" viewBox="0 0 40 40" aria-hidden>
            <defs>
              <linearGradient id="prism-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#A78BFA" />
              </linearGradient>
            </defs>
            <polygon points="20,4 36,34 4,34" fill="url(#prism-grad)" opacity="0.85" />
          </svg>
          <span className="bg-gradient-to-br from-blue-400 to-violet-400 bg-clip-text text-transparent">
            SM
          </span>
        </div>
        <span className="hidden text-xs opacity-80 sm:inline md:text-sm">
          Reflect the Whole Child
        </span>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button
          type="button"
          onClick={toggle}
          className={`rounded-full border-2 px-3 py-1 text-xs font-semibold transition ${
            enabled
              ? 'border-green-500 bg-green-950 text-green-400'
              : 'border-gray-500 bg-transparent text-gray-300'
          }`}
          aria-pressed={enabled}
        >
          💡 Help Assist: {enabled ? 'ON' : 'OFF'}
        </button>
        <button
          type="button"
          onClick={() => setThemeStudioOpen(true)}
          className="rounded-lg border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
        >
          Theme
        </button>
        <NavLink
          to="/district"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-sm font-bold text-white"
          title="District Profile"
        >
          SK
        </NavLink>
      </div>
    </header>
  )
}
