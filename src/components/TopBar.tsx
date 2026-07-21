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
      <NavLink to="/" className="flex min-w-0 items-center gap-2" aria-label="PRISM home">
        <img
          src="/prism-logo.svg"
          alt="PRISM — Reflect the Whole Human"
          className="h-11 w-auto max-w-[min(52vw,280px)] object-contain object-left"
        />
      </NavLink>

      <div className="flex shrink-0 items-center gap-2 md:gap-3">
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
